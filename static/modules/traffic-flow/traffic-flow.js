// Copyright (c) 2026 https://abcbox.kr
// Licensed under the MIT License.

// 전체 도로 길이
const ROAD_LENGTH = 300;
const KMH_TO_MS = 1000 / 3600;
const CAR_LENGTH = 4.7;
const HILL_START = ROAD_LENGTH * 0.4;
const HILL_END = ROAD_LENGTH * 0.9;
// 합류 지점 위치
const MERGE_POINT = ROAD_LENGTH * 0.6;
// "합류 대기" 라벨을 표시할 위치 등 시각적 표시에 쓰는 기준 거리
const MERGE_ZONE_RANGE = 50;
// 램프차가 합류점(MERGE_POINT)을 통과할 때의 목표 속도(targetVelocity
// 참고). 주행 속도 그대로 진입하면 실제 간격에 맞춰 줄일 시간이
// 부족해 본선 차를 추월하듯 파고들게 되므로 합류점에서는 이 속도까지 줄이는 것으로 한다.
const MERGE_MAX_SPEED_KMH = 25;
// 합류점 감속 곡선을 계산할 때 쓰는 감속도(m/s^2). 차량 각자의 실제
// 제동력(braking, 2.8~4.0)보다 훨씬 여유 있게 낮은 값을 일부러 쓴다 —
// "이 차가 낼 수 있는 최대 제동력 기준"으로 곡선을 그리면 정말 그
// 순간까지 버티다가 막판에야 급하게 따라잡아야 해서(추종 로직이
// 목표를 서서히 뒤쫓는 방식이라 더 그렇다), 결국 처음엔 거의 안
// 줄고 뒤쪽에서 몰아서 줄이는 것처럼 보인다. 여유 있게 낮은 감속도를
// 가정하면 감속 시작 지점 자체가 훨씬 앞당겨져서 여유 있게 따라잡을
// 시간이 생긴다.
const MERGE_COMFORTABLE_DECEL = 1.5;
// 합류 시나리오의 차들은 합류 전에는 자기 앞차만 신경 쓴다.
// 그러다 합류점에 가까운 차는 이 설정 값의 합류점 근처 안에 오면
// 다른 차로 차량에 대해 신경쓰게 된다.
const RAMP_AWARENESS_RANGE = 50;
// 앞차와의 간격이 이미 좁아 급제동이 필요하더라도 가속도
// 자체가 한 프레임 만에 주행 수준에서 최대 제동으로 뚝 떨어지면 화면
// 상으로 "갑자기 멈칫"하는 것처럼 보인다. 실제 운전자도 반응에 약간의
// 시간이 걸리는 것처럼 초당 이만큼(m/s^3, jerk)까지만 가속도가 변하게
// 제한해 제동이 부드럽게 걸리도록 한다.
const ACCEL_JERK_LIMIT = 9;
// 운전자가 염두에 두는 차간 최소 간격
const MINIMUM_GAP = 4;
// 실제 발생할 수 있는 차간 최소 간격
const MIN_PHYSICAL_GAP = 0.5;
// 오르막 영향의 최대값(km/h)
const HILL_GRADE_MAX = 15;
// 현실의 정체는 한 번 급감속하면 앞이 열려도 곧장 원래 속도로 돌아가지
// 않는 capacity drop(용량 저하) 현상 때문에 오래 유지된다. 급브레이크를
// 밟은 차는 이 시간(초) 동안 더 조심스럽게(반응은 느리게, 가속은 약하게)
// 움직이도록 해서, 오르막 초입에서만 반짝 빨개지는 게 아니라 정상 부근
// 까지 정체가 이어지게 한다.
const JAM_TRIGGER_RATIO = 0.5;
const JAM_RECOVERY_TIME = 8;
const JAM_REACTION_MULT = 1.6;
const JAM_ACCEL_MULT = 0.55;
const COLORS = {
  fast: '#22c55e',
  medium: '#f59e0b',
  slow: '#ef4444',
  road: '#3f4854',
  background: '#cfe5ca',
  marking: '#f8fafc',
};

const HILL_SEED = 12345678;
const JAM_SEED = 7890123;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function speedColor(speedKmh) {
  if (speedKmh < 25) return COLORS.slow;
  if (speedKmh < 55) return COLORS.medium;
  return COLORS.fast;
}

class Vehicle {
  constructor({
    lane,
    pos,
    velocity,
    targetVelocity,
    reaction,
    acceleration,
    braking,
  }) {
    this.lane = lane;
    this.pos = pos;
    this.velocity = velocity;
    this.targetVelocity = targetVelocity;
    this.reaction = reaction;
    this.acceleration = acceleration;
    this.braking = braking;
    this.lastAcceleration = 0;
    this.jamCooldown = 0;
  }

  update(deltaT, road) {
    const leader = road.leaderOf(this);
    const baseReactionTime = road.reactionTime(this);
    // 급브레이크를 밟은 직후에는(jamCooldown > 0) 앞이 열려도 평소보다
    // 조심스럽게 반응한다 — capacity drop을 흉내내는 부분.
    const reactionTime =
      this.jamCooldown > 0
        ? baseReactionTime * JAM_REACTION_MULT
        : baseReactionTime;
    const freeTarget = road.targetVelocity(this);
    const accelCap =
      this.jamCooldown > 0
        ? this.acceleration * JAM_ACCEL_MULT
        : this.acceleration;

    // IDM(Intelligent Driver Model) 공식: 상황별로 다른 규칙을
    // 적용하는 게 아니라 앞차와의 간격(gap) 하나로 가속도를 계산한다.
    // 아래 desiredGap(원하는 간격)은 "기본 거리 + 속도×반응시간"이 기본값이고,
    // 앞차와 가까워지는 중일 때(deltaV, 상대속도 > 0)만 여유분이 더 붙어서
    // 커진다. 앞차가 가까워지고 있지 않으면 이 여유분은 자동으로 0이 되므로,
    // "지금 진짜 좁혀지는 중인가"를 따로 조건문으로 확인할 필요가 없다.
    // 그리고 실제 간격이 desiredGap보다 좁을수록 (desiredGap/gap)^2만큼
    // 감속이 점점 더 강하게 걸린다.
    let gapTerm = 0;
    let gap = Number.POSITIVE_INFINITY;
    const desiredGapStatic = MINIMUM_GAP + this.velocity * reactionTime;
    if (leader) {
      const sameLane = leader.lane === this.lane;
      // CAR_LENGTH(범퍼 간 거리)는 같은 차로에 있는 두 차에게만 의미가
      // 있다. 아직 합류하지 않은 차와 본선차는 서로 다른 물리 도로 위에
      // 있으므로, 여기서 gap은 "범퍼 간 거리"가 아니라 "합류점 도착
      // 순서상의 여유"를 뜻한다 — pos 차이 그대로 쓴다.
      const rawGap = leader.pos - this.pos - (sameLane ? CAR_LENGTH : 0);
      gap = Math.max(0.1, rawGap);
      const deltaV = this.velocity - leader.velocity;
      const desiredGap =
        MINIMUM_GAP +
        Math.max(
          0,
          this.velocity * reactionTime +
            (this.velocity * deltaV) / (2 * Math.sqrt(accelCap * this.braking)),
        );
      gapTerm = (desiredGap / gap) ** 2;
    }
    const freeTerm = (this.velocity / freeTarget) ** 4;
    const rawAcceleration = accelCap * (1 - freeTerm - gapTerm);
    const targetAcceleration = clamp(rawAcceleration, -this.braking, accelCap);
    // 새로 잡힌 앞차와 이미 간격이 좁아 목표 가속도가 순간적으로 크게
    // 떨어지더라도, 가속도 자체는 초당 ACCEL_JERK_LIMIT만큼만 바뀌도록
    // 제한한다. 실제 운전자가 위험을 감지한 순간 즉시 최대 제동력을 내는
    // 게 아니라 짧게나마 밟는 힘을 늘려가는 것과 같다 — 앞차가 갑자기
    // "발견"돼도 화면에서는 급정거가 아니라 빠르게 굳어지는 제동으로 보인다.
    const maxJerk = ACCEL_JERK_LIMIT * deltaT;
    const appliedAcceleration = clamp(
      targetAcceleration,
      this.lastAcceleration - maxJerk,
      this.lastAcceleration + maxJerk,
    );
    this.lastAcceleration = appliedAcceleration;

    // 정체에서 벗어났다고 판단하는 기준은 "앞이 살짝 열렸다"가 아니라
    // "원래 낼 수 있는 자유 속도 근처까지 실제로 회복했다"이다. 그래야
    // 느린 무리를 따라가는 동안에는 계속 조심스러운 상태가 유지되어,
    // 오르막 진입부에서만 반짝 느려지는 게 아니라 대열 전체가 정상
    // 부근까지 낮은 속도로 이어진다.
    const trulyRecovered =
      this.velocity >= freeTarget * 0.92 &&
      (!leader || gap > desiredGapStatic * 1.1);
    if (appliedAcceleration < -this.braking * JAM_TRIGGER_RATIO) {
      this.jamCooldown = JAM_RECOVERY_TIME;
    } else if (trulyRecovered) {
      this.jamCooldown = Math.max(0, this.jamCooldown - deltaT);
    }

    // 급정거해서 목표 간격(MINIMUM_GAP)보다 가까워진 경우 그 자리에 그대로 멈춰 있는다.
    // 앞차가 움직여 간격이 벌어지면 다시 자연스럽게 가속한다.
    const prevPos = this.pos;
    this.velocity = Math.max(0, this.velocity + appliedAcceleration * deltaT);
    this.pos += this.velocity * deltaT;

    // if (leader && leader.lane === this.lane) {
    // 같은 차로(범퍼 거리 개념이 성립하는 경우)에서만: 이산 시간(deltaT
    // 단위) 계산 + jerk 제한 때문에 최대 제동으로 올라가는 데 몇 프레임이
    // 걸리는 사이, 이미 좁던 간격이 실제로 음수(물리적 겹침)까지 내려갈
    // 수 있다 — IDM 공식만으로는 이 한 프레임 단위의 계산 오차까지 막지
    // 못한다. 그래서 "정체 시 목표 간격을 유지"가 아니라 "차체가 실제로
    // 겹치지만 않게" 하는, 훨씬 작은 여유값의 최후 안전장치만 둔다.
    // 순간이동 없이 초당 OVERLAP_RESOLVE_SPEED만큼만 물러나 눈에 띄지
    // 않게 한다.
    // const limitingPosition = leader.pos - CAR_LENGTH - MIN_PHYSICAL_GAP;
    // if (this.pos > limitingPosition) {
    //   const maxRetreat = OVERLAP_RESOLVE_SPEED * deltaT;
    //   this.pos = Math.max(limitingPosition, prevPos - maxRetreat);
    //   this.velocity = Math.min(this.velocity, leader.velocity);
    // }
    // }

    if (this.lane === 2 && this.pos >= MERGE_POINT) {
      // 실제로 합류점을 지난 시점에야 lane을 1로 확정한다.
      this.lane = 1;
    }
  }
}

class TrafficScenario {
  constructor(root, type) {
    this.root = root;
    this.type = type;
    this.canvas = root.querySelector('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.chart = root.querySelector('.traffic-demo__chart');
    this.playButton = root.querySelector('[data-action="play"]');
    this.waveToggle = root.querySelector('[data-control="waves"]');
    this.controls = {};
    this.history = [];
    this.cars = [];
    this.running = !window.matchMedia('(prefers-reduced-motion: reduce)')
      .matches;
    this.lastTime = performance.now();
    this.sampleElapsed = 0;
    this.spawnElapsed = { hill: 0, main: 0, ramp: 0 };
    this.hillNextLane = 0;
    this.random = seededRandom(type === 'hill' ? HILL_SEED : JAM_SEED);

    root.querySelectorAll('[data-control]').forEach((input) => {
      this.controls[input.dataset.control] = input;
      if (input.type === 'range') {
        input.addEventListener('input', () => this.onControlChange(input));
        this.updateOutput(input);
      }
    });
    this.playButton.textContent = this.running ? '일시정지' : '재생';
    this.playButton.setAttribute('aria-pressed', String(this.running));
    this.playButton.addEventListener('click', () => this.toggle());
    root
      .querySelector('[data-action="reset"]')
      .addEventListener('click', () => this.reset());

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.canvas);
    this.reset();
  }

  value(name) {
    return Number(this.controls[name]?.value ?? 0);
  }

  updateOutput(input) {
    const output = this.root.querySelector(
      `[data-output="${input.dataset.control}"]`,
    );
    if (!output) return;
    const suffix = input.dataset.suffix || '';
    output.textContent = `${input.value}${suffix}`;
  }

  onControlChange(input) {
    this.updateOutput(input);
    if (input.dataset.rebuild === 'true') this.reset();
  }

  toggle() {
    this.running = !this.running;
    this.playButton.textContent = this.running ? '일시정지' : '재생';
    this.playButton.setAttribute('aria-pressed', String(this.running));
    this.lastTime = performance.now();
  }

  reset() {
    this.random = seededRandom(this.type === 'hill' ? HILL_SEED : JAM_SEED);
    this.history = [];
    this.sampleElapsed = 0;
    this.spawnElapsed = { hill: 0, main: 0, ramp: 0 };
    this.hillNextLane = 0;
    this.cars = [];
    this.seedInitialTraffic();
    this.updateMetrics();
    this.draw();
  }

  seedInitialTraffic() {
    // 완전히 빈 도로에서 시작하면 부자연스럽다. 각 차로에 세 대 정도씩
    // 이미 차가 다니고 있던 것처럼 초기 차량을 깔아 둔다. 간격은
    // freeFlowSafeSpacing 이상으로 둬서, 재생 시작과 동시에 안전거리
    // 부족으로 브레이크를 밟는 일이 없게 한다.
    const spacing = this.freeFlowSafeSpacing();
    const seedLane = (lane, startPos, speedKmh) => {
      for (let i = 0; i < 3; i += 1) {
        this.cars.push(
          this.createCar(
            startPos + spacing * (i + this.random() / 3),
            lane,
            speedKmh(),
          ),
        );
      }
    };

    if (this.type === 'hill') {
      seedLane(0, 0, () => 81 + this.random() * 2);
      seedLane(1, 0, () => 81 + this.random() * 2);
      return;
    }

    seedLane(1, 0, () => this.mainCruiseSpeedKmh());
    seedLane(2, 0, () => this.mainCruiseSpeedKmh());
  }

  createCar(position, lane, targetKmh, extra = {}) {
    return new Vehicle({
      pos: position,
      lane,
      velocity: targetKmh * KMH_TO_MS,
      targetVelocity: targetKmh * KMH_TO_MS,
      reaction: 1.0 + this.random() * 0.65,
      acceleration: 1.35 + this.random() * 0.45,
      braking: 2.8 + this.random() * 1.2,
      ...extra,
    });
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(rect.width * ratio));
    const height = Math.max(1, Math.round(rect.height * ratio));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      this.draw();
    }
  }

  tick(now, isVisible) {
    const elapsed = Math.min((now - this.lastTime) / 1000, 0.06);
    this.lastTime = now;
    if (this.running && isVisible) {
      let remaining = elapsed * this.value('timeScale');
      while (remaining > 0) {
        const step = Math.min(remaining, 0.04);
        this.updateVehicles(step);
        remaining -= step;
      }
    }
    if (isVisible) this.draw();
  }

  updateVehicles(dt) {
    this.spawnVehicles(dt);

    // 앞차부터 계산하면 뒤차는 같은 프레임에서 갱신된 앞차 위치를 본다.
    // 각 Vehicle은 앞차, 목표 속도, 합류 가능 여부만 전달받아 스스로
    // 다음 속도와 위치를 계산한다.
    [...this.cars]
      .sort((a, b) => b.pos - a.pos)
      .forEach((vehicle) => vehicle.update(dt, this));

    this.cars = this.cars.filter((vehicle) => vehicle.pos <= ROAD_LENGTH + 12);
    this.sampleElapsed += dt;
    if (this.sampleElapsed >= 0.45) {
      this.sampleElapsed = 0;
      this.history.push(this.averageSpeed());
      if (this.history.length > 90) this.history.shift();
      this.updateMetrics();
    }
  }

  spawnVehicles(dt) {
    if (this.type === 'hill') {
      const spacing = ROAD_LENGTH / this.value('inflow');
      // 슬라이더 값(대/분)을 그대로 분당 유입 대수로 써서, 표기된 숫자와
      // 실제 스폰 빈도가 일치하게 한다 — 합류 램프 계산과 같은 기준이다.
      const interval = 60 / Math.max(1, this.value('inflow'));
      this.spawnElapsed.hill += dt;
      while (this.spawnElapsed.hill >= interval) {
        // 차례가 된 차로가 막혀 있으면 반대 차로로 넘겨본다. 그냥
        // break해버리면 한쪽 차로가 막힐 때마다 반대 차로까지 덩달아
        // 유입이 끊겨, 먼저 막힌 차로만 계속 막히는 편향이 생긴다.
        let lane = this.hillNextLane;
        if (
          this.cars.some((car) => car.lane === lane && car.pos < spacing * 0.72)
        ) {
          const otherLane = lane === 0 ? 1 : 0;
          if (
            this.cars.some(
              (car) => car.lane === otherLane && car.pos < spacing * 0.72,
            )
          )
            break;
          lane = otherLane;
        }
        // 간격이 완전히 일정하면 부자연스러우니 ±25% 정도 무작위성을 준다.
        this.spawnElapsed.hill -= interval * (0.75 + this.random() * 0.5);
        const freeSpeedKmh = 81 + this.random() * 2;
        this.cars.push(
          this.createCar(0, lane, freeSpeedKmh, {
            velocity: this.spawnVelocityMs(lane, 0, freeSpeedKmh),
          }),
        );
        this.hillNextLane = lane === 0 ? 1 : 0;
      }
      return;
    }

    const mainSpacing = ROAD_LENGTH / this.value('mainInflow');
    // 합류 램프의 유입량(대/분)과 같은 기준으로 맞춘다.
    const mainInterval = 60 / Math.max(1, this.value('mainInflow'));
    this.spawnElapsed.main += dt;
    while (this.spawnElapsed.main >= mainInterval) {
      if (
        this.cars.some((car) => car.lane === 1 && car.pos < mainSpacing * 0.72)
      )
        break;
      this.spawnElapsed.main -= mainInterval * (0.75 + this.random() * 0.5);
      const freeSpeedKmh = this.mainCruiseSpeedKmh();
      this.cars.push(
        this.createCar(0, 1, freeSpeedKmh, {
          velocity: this.spawnVelocityMs(1, 0, freeSpeedKmh),
        }),
      );
    }

    const rampInterval = 60 / Math.max(1, this.value('inflow'));
    const rampSpacing = ROAD_LENGTH / Math.max(1, this.value('inflow'));
    const rampStart = 0;
    this.spawnElapsed.ramp += dt;
    while (this.spawnElapsed.ramp >= rampInterval) {
      // 본선(mainSpacing * 0.72)과 같은 기준으로 진입 가능 여부를 판단한다.
      const rampEntryClear = !this.cars.some(
        (car) => car.lane === 2 && car.pos < rampStart + rampSpacing * 0.72,
      );
      if (!rampEntryClear) break;
      this.spawnElapsed.ramp -= rampInterval * (0.75 + this.random() * 0.5);
      // 목표 속도(targetVelocity)는 항상 주행 속도로 둬서, 정체가
      // 풀리면 다시 그 속도까지 가속하려 한다. 다만 화면에 나타나는
      // 순간의 실제 속도(velocity)는 앞차 속도에 맞춘다.
      const freeSpeedKmh = this.mainCruiseSpeedKmh();
      this.cars.push(
        this.createCar(rampStart, 2, freeSpeedKmh, {
          velocity: this.spawnVelocityMs(2, rampStart, freeSpeedKmh),
        }),
      );
    }
  }

  mainCruiseSpeedKmh() {
    return 80 + this.random() * 2;
  }

  // 진입 지점(entryPos) 바로 앞 좁은 구간만 보면, 정체가 조금 더 앞쪽
  // (예: 합류로면 합류점 근처)에 몰려 있을 때 그 구간이 비어 있다는
  // 이유만으로 새 차가 계속 주행 속도로 들어와 버린다. 대신 그 차로에서
  // 가장 가까운 앞차(거리 무관) 하나만 보고, 그 차가 이미 정체 속도라면
  // 새 차도 처음부터 그 속도로 들어오게 한다 — 실제 운전자도 앞쪽에
  // 보이는 정체를 보고 진입 속도부터 늦추는 것과 같다.
  spawnVelocityMs(lane, entryPos, freeSpeedKmh) {
    const leader = this.cars
      .filter((car) => car.lane === lane && car.pos > entryPos)
      .sort((a, b) => a.pos - b.pos)[0];
    if (!leader) return freeSpeedKmh * KMH_TO_MS;
    return Math.min(freeSpeedKmh * KMH_TO_MS, leader.velocity);
  }

  leaderOf(vehicle) {
    const ahead = this.cars.filter(
      (other) => other !== vehicle && other.pos > vehicle.pos,
    );
    if (this.type !== 'merge') {
      return (
        ahead
          .filter((other) => other.lane === vehicle.lane)
          .sort((a, b) => a.pos - b.pos)[0] || null
      );
    }

    // 합류점 근처(RAMP_AWARENESS_RANGE 이내)에 들어온 램프차는 전부 본선과의
    // 관계를 맺을 수 있다 — 이 범위 밖에서는 램프 초입 차가 저 멀리 있는
    // 본선차와 pos가 우연히 비슷하다고 미리 반응하지 않도록 걸러 둔다.
    // (예전에는 이 중 합류점에 가장 가까운 한 대만 노출했는데, 유입량이
    // 많아 램프 큐가 여러 대로 길어지면 뒤쪽 차들이 실제로 합류점 코앞까지
    // 와도 본선에서는 전혀 안 보이다가, 자기 앞차가 막 합류를 마치는
    // 순간에야 갑자기 나타나 본선차가 반응할 시간이 없었다.)
    const nearMergeRamp = this.cars.filter(
      (other) =>
        other.lane === 2 && other.pos >= MERGE_POINT - RAMP_AWARENESS_RANGE,
    );

    if (vehicle.lane === 2) {
      const rampLeader = ahead
        .filter((other) => other.lane === 2)
        .sort((a, b) => a.pos - b.pos)[0];
      if (rampLeader) return rampLeader;
      const frontRamp =
        [...nearMergeRamp].sort((a, b) => b.pos - a.pos)[0] || null;
      if (vehicle !== frontRamp) return null;
      // 본선에서 "합류 후 내 바로 앞이 될 차" 하나만 본다.
      return (
        ahead
          .filter((other) => other.lane === 1)
          .sort((a, b) => a.pos - b.pos)[0] || null
      );
    }

    // 본선차는 기본적으로 같은 차로 앞차만 본다. 다만 합류점 근처의 램프차
    // 중 내 앞에 있는 차가 있다면 후보에 넣는다 — 램프 큐 전체가 각자
    // 가장 가까운 본선차에게 보이게 되어, 큐 뒷차가 막 튀어나오듯 합류하는
    // 일이 없어진다.
    const candidates = ahead.filter(
      (other) => other.lane === 1 || nearMergeRamp.includes(other),
    );
    return candidates.sort((a, b) => a.pos - b.pos)[0] || null;
  }

  freeFlowSafeSpacing() {
    // 초기 배치 간격의 하한. Vehicle.update()의 desiredGap 공식을
    // createCar가 뽑는 최악의 조합(속도 83km/h, 반응시간 1.65s, 뒤차가
    // 앞차보다 2km/h 빠름, 가속·제동 여유는 최소치)으로 계산해서, 어떤
    // 조합이 나와도 IDM이 요구하는 안전거리보다 좁게 배치되지 않게 한다.
    // 배치 시 곱해지는 무작위 배수의 최솟값(0.85)까지 나눠서, 그 배수가
    // 가장 작게 나오는 경우에도 안전하도록 한다.
    const velocity = 83 * KMH_TO_MS;
    const reactionTime = 1.65;
    const deltaV = 2 * KMH_TO_MS;
    const accelCap = 1.35;
    const braking = 2.8;
    const desiredGap =
      MINIMUM_GAP +
      velocity * reactionTime +
      (velocity * deltaV) / (2 * Math.sqrt(accelCap * braking));
    return desiredGap / 0.85;
  }

  reactionTime(vehicle) {
    if (
      this.type === 'hill' &&
      vehicle.pos >= HILL_START &&
      vehicle.pos < HILL_END
    ) {
      // 오르막에서는 같은 속도라도 가속 여유가 작아 간격 회복이 늦다.
      // 이 처리 용량 감소가 상류로 퍼지는 대기 행렬을 만든다.
      return vehicle.reaction + (this.value('grade') / HILL_GRADE_MAX) * 2.5;
    }
    return vehicle.reaction;
  }

  targetVelocity(vehicle) {
    let target = vehicle.targetVelocity;
    if (
      this.type === 'hill' &&
      vehicle.pos >= HILL_START &&
      vehicle.pos < HILL_END
    ) {
      // 슬라이더 값(km/h)이 곧 목표 속도 감소량이 되도록 그대로 뺀다.
      target -= this.value('grade') * KMH_TO_MS;
    }
    if (this.type === 'merge' && vehicle.lane === 2) {
      // 합류점을 고정된 위치에 서 있는 "앞차"로 취급하면, 그 앞차가
      // 절대 움직이지 않으니 간격이 결국 0으로 수렴해 완전히 멈춰
      // 서 버린다. 대신 등가속도 제동 공식 v^2 = v0^2 - 2·a·d를 목표
      // 속도(v0)에 대해 풀어서 "지금부터 MERGE_COMFORTABLE_DECEL로
      // 감속하면 합류점에서 정확히 MERGE_MAX_SPEED_KMH가 되는 속도"를
      // 매 순간 목표로 역산한다 — 남은 거리가 멀수록 값이 커지고(=아직
      // 안 줄여도 됨), 합류점(거리 0)에서는 정확히 MERGE_MAX_SPEED_KMH로
      // 수렴한다(=거기서 멈추지 않고 계속 그 속도로 통과).
      const mergeCap = MERGE_MAX_SPEED_KMH * KMH_TO_MS;
      const distanceToMerge = Math.max(0, MERGE_POINT - vehicle.pos);
      const brakingCurveSpeed = Math.sqrt(
        mergeCap ** 2 + 2 * MERGE_COMFORTABLE_DECEL * distanceToMerge,
      );
      target = Math.min(target, brakingCurveSpeed);
    }
    // 본선차는 목표 속도를 미리 깎지 않는다. 다가오는 램프차가 있으면
    // leaderOf가 그 차를 앞차로 잡아주는 것만으로 자연스럽게 감속하고,
    // 없으면 주행 속도를 그대로 유지한다.
    return Math.max(8 * KMH_TO_MS, target);
  }

  rampWaitPosition() {
    // "합류 대기" 라벨을 그릴 위치. leaderOf가 실제로 본선을 의식하기
    // 시작하는 기준은 RAMP_AWARENESS_RANGE이고, 이 값은 순전히 시각적
    // 기준일 뿐이다.
    return Math.max(0, MERGE_POINT - MERGE_ZONE_RANGE);
  }

  averageSpeed() {
    if (!this.cars.length) return 0;
    return (
      this.cars.reduce((sum, car) => sum + car.velocity / KMH_TO_MS, 0) /
      this.cars.length
    );
  }

  updateMetrics() {
    const speeds = this.cars.map((car) => car.velocity / KMH_TO_MS);
    const average =
      speeds.reduce((sum, speed) => sum + speed, 0) /
      Math.max(1, speeds.length);
    const minimum = speeds.length ? Math.min(...speeds) : 0;
    const slowShare =
      speeds.filter((speed) => speed < 30).length / Math.max(1, speeds.length);
    let label = '안정 흐름';
    let state = 'stable';
    if (!speeds.length) {
      label = '차량 진입 전';
    } else if (minimum < 18 || slowShare > 0.18) {
      label = '정체 발생';
      state = 'jam';
    } else if (minimum < 52 || average < 62) {
      label = '불안정';
      state = 'unstable';
    }

    this.root.querySelector('[data-metric="average"]').textContent =
      `${Math.round(average)} km/h`;
    this.root.querySelector('[data-metric="minimum"]').textContent =
      `${Math.round(minimum)} km/h`;
    const stateElement = this.root.querySelector('[data-metric="state"]');
    stateElement.textContent = label;
    stateElement.dataset.state = state;
    this.drawChart();
  }

  draw() {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    if (!width || !height) return;
    this.ctx.clearRect(0, 0, width, height);
    if (this.type === 'hill') this.drawHill(width, height);
    else this.drawMerge(width, height);
  }

  drawHill(width, height) {
    const ctx = this.ctx;
    const left = 24;
    const usable = width - 48;
    const centerY = (x) => {
      const p = x / ROAD_LENGTH;
      if (p < HILL_START / ROAD_LENGTH) return height * 0.64;
      if (p < HILL_END / ROAD_LENGTH) {
        const hillProgress = (x - HILL_START) / (HILL_END - HILL_START);
        return height * (0.64 - hillProgress * 0.16);
      }
      return height * 0.48;
    };
    const roadPoint = (position) => ({
      x: left + (position / ROAD_LENGTH) * usable,
      y: centerY(position),
    });

    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, width, height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = COLORS.road;
    ctx.lineWidth = 46;
    ctx.beginPath();
    for (let x = 0; x <= ROAD_LENGTH; x += 10) {
      const p = roadPoint(x);
      if (x === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();

    ctx.setLineDash([14, 12]);
    ctx.strokeStyle = COLORS.marking;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = '700 12px sans-serif';
    ctx.fillStyle = '#365314';
    const hillMiddle = (HILL_START + HILL_END) / 2;
    ctx.fillText(
      '오르막',
      roadPoint(hillMiddle).x - 20,
      roadPoint(hillMiddle).y - 44,
    );

    this.drawWaveOverlay(roadPoint, width);
    this.cars.forEach((car) => {
      const point = roadPoint(car.pos);
      const next = roadPoint(car.pos + 2);
      const angle = Math.atan2(next.y - point.y, next.x - point.x);
      this.drawCar(
        point.x,
        point.y + (car.lane ? 10.5 : -10.5),
        angle,
        car.velocity / KMH_TO_MS,
      );
    });
  }

  drawMerge(width, height) {
    const ctx = this.ctx;
    const left = 24;
    const usable = width - 48;
    const mainY = height * 0.45;
    const roadX = (position) => left + (position / ROAD_LENGTH) * usable;
    const mergeEnd = roadX(MERGE_POINT);
    // 본선 시작점 근처부터 뻗어 나오게 해서 화면상 본선과 맞먹는 길이로
    // 보이게 한다.
    const rampStartX = roadX(0);
    // 합류로는 시작부터 합류점까지 완전한 직선으로, 실제 도로 표지처럼
    // 본선을 향해 곧게 뻗어 들어오게 그린다.
    const rampStartY = height * 0.92;
    const straightDx = mergeEnd - rampStartX;
    const straightDy = mainY - rampStartY;
    const straightLength = Math.hypot(straightDx, straightDy) || 1;
    const rampPoint = (progress) => {
      const t = clamp(progress, 0, 1);
      return {
        x: rampStartX + t * straightDx,
        y: rampStartY + t * straightDy,
        angle: Math.atan2(straightDy, straightDx),
        normalX: -straightDy / straightLength,
        normalY: straightDx / straightLength,
      };
    };

    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = COLORS.road;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 34;
    ctx.beginPath();
    ctx.moveTo(left, mainY);
    ctx.lineTo(width - left, mainY);
    ctx.stroke();

    // 본선과 완전히 같은 방식(둥근 캡 스트로크)으로 그려서, 합류점에서
    // 본선과 자연스럽게 하나로 이어지게 한다.
    ctx.strokeStyle = COLORS.road;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 34;
    ctx.beginPath();
    ctx.moveTo(rampStartX, rampStartY);
    ctx.lineTo(mergeEnd, mainY);
    ctx.stroke();

    ctx.fillStyle = '#334155';
    ctx.font = '700 12px sans-serif';
    // 합류로 폭을 넘어서도록 직선의 법선 방향으로 라벨을 밀어내, 도로와
    // 글자가 겹치지 않게 한다. textAlign을 center로 둬서 점을 중심으로
    // 맞춘다.
    const rampStartPosition = 0;
    const waitProgress =
      (this.rampWaitPosition() - rampStartPosition) /
      (MERGE_POINT - rampStartPosition);
    const waitPoint = rampPoint(waitProgress);
    const waitLabelOffset = 48;
    ctx.textAlign = 'center';
    ctx.fillText(
      '합류 대기',
      waitPoint.x + waitPoint.normalX * waitLabelOffset,
      waitPoint.y + waitPoint.normalY * waitLabelOffset,
    );
    ctx.textAlign = 'start';
    ctx.fillText('공간을 보며 합류', mergeEnd - 42, mainY - 30);

    const roadPoint = (position) => ({ x: roadX(position), y: mainY });
    this.drawWaveOverlay(roadPoint, width);
    this.cars
      .filter((car) => car.lane === 1)
      .forEach((car) => {
        this.drawCar(roadX(car.pos), mainY, 0, car.velocity / KMH_TO_MS);
      });

    this.cars
      .filter((car) => car.lane === 2)
      .forEach((car) => {
        const progress =
          (car.pos - rampStartPosition) / (MERGE_POINT - rampStartPosition);
        const point = rampPoint(progress);
        // 차간 거리는 IDM 로직이 보장하므로, 별도 오프셋 없이 항상 중심선
        // 위를 그대로 달리게 한다.
        this.drawCar(point.x, point.y, point.angle, car.velocity / KMH_TO_MS);
      });
  }

  drawWaveOverlay(pointForPosition, width) {
    if (!this.waveToggle.checked) return;
    // 완전히 막힌 뒤뿐 아니라 감속이 시작되는 순간부터 파동을 보여준다.
    // 다만 "순간 가속도가 음수"를 기준으로 삼으면, 초기에 깔아 둔 차들이
    // 이상적인 차간거리에 아주 살짝 못 미치기만 해도(IDM 공식이 간격에
    // 아주 민감하다) 실제 정체와 무관하게 매 프레임 반짝반짝 걸린다.
    // 오르막 진입도 마찬가지로, 앞차와 무관하게 목표 속도 자체가 그
    // 자리에서 떨어지므로 홀로 달리는 차도 한 번은 브레이크를 밟는다.
    // 둘 다 "뒤로 전파되는 정체 파동"이 아니라 순간적인 조정일 뿐이다.
    // 그래서 순간 가속도 대신 "지금(경사 반영) 목표 속도보다 실제로
    // 확연히 느려졌는가"로 판단한다 — 이건 그 순간의 물리 잡음이 아니라
    // 실제로 뒤차가 앞차 때문에 원하는 속도를 못 내고 있다는 뜻이라
    // 정체가 누적돼야만 켜진다.
    const slowCars = this.cars.filter((car) => {
      if (this.type === 'merge' && car.lane !== 1) return false;
      const isUpstreamWave = this.type !== 'hill' || car.pos < HILL_END;
      const freeTarget = this.targetVelocity(car);
      const isSlowing =
        car.velocity / KMH_TO_MS < 62 || car.velocity < freeTarget * 0.85;
      return isUpstreamWave && isSlowing;
    });
    if (!slowCars.length) return;
    const ctx = this.ctx;
    slowCars.forEach((car) => {
      const point = pointForPosition(car.pos);
      const gradient = ctx.createRadialGradient(
        point.x,
        point.y,
        3,
        point.x,
        point.y,
        42,
      );
      gradient.addColorStop(0, 'rgb(239 68 68 / 30%)');
      gradient.addColorStop(1, 'rgb(239 68 68 / 0%)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 42, 0, Math.PI * 2);
      ctx.fill();
    });

    const slowest = slowCars.reduce(
      (best, car) => (car.velocity < best.velocity ? car : best),
      slowCars[0],
    );
    const point = pointForPosition(slowest.pos);
    const arrowStart = clamp(point.x + 58, 90, width - 24);
    const arrowEnd = clamp(point.x - 44, 22, width - 92);
    ctx.strokeStyle = '#dc2626';
    ctx.fillStyle = '#dc2626';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(arrowStart, point.y - 46);
    ctx.lineTo(arrowEnd, point.y - 46);
    ctx.lineTo(arrowEnd + 9, point.y - 52);
    ctx.moveTo(arrowEnd, point.y - 46);
    ctx.lineTo(arrowEnd + 9, point.y - 40);
    ctx.stroke();
    ctx.font = '800 11px sans-serif';
    ctx.fillText('감속 파동', arrowEnd, point.y - 57);
  }

  drawCar(x, y, angle, speedKmh) {
    const ctx = this.ctx;
    // 실제 축척(px/m)대로 그려서 화면상 겹침이 곧 실제 간격 부족과
    // 일치하게 한다. 너무 작아 안 보이는 것만 막는 바닥값만 둔다.
    const pxPerMeter = (this.canvas.clientWidth - 48) / ROAD_LENGTH;
    const carWidth = Math.max(5, pxPerMeter * CAR_LENGTH);
    const carHeight = carWidth * 0.6;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = speedColor(speedKmh);
    ctx.strokeStyle = 'rgb(15 23 42 / 45%)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(-carWidth / 2, -carHeight / 2, carWidth, carHeight, 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgb(224 242 254 / 80%)';
    ctx.fillRect(
      carWidth * 0.1,
      -carHeight * 0.34,
      carWidth * 0.24,
      carHeight * 0.68,
    );
    ctx.restore();
  }

  drawChart() {
    const svg = this.chart;
    if (!svg || this.history.length < 2) return;
    const width = 300;
    const height = 44;
    const points = this.history
      .map((speed, index) => {
        const x = (index / Math.max(1, this.history.length - 1)) * width;
        const y = height - clamp(speed / 90, 0, 1) * (height - 3);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
    svg.innerHTML = `
      <line x1="0" y1="31.8" x2="300" y2="31.8" stroke="#fecaca" stroke-dasharray="4 4" />
      <polyline points="${points}" fill="none" stroke="#2563eb" stroke-width="2.5" vector-effect="non-scaling-stroke" />
    `;
  }
}

class TrafficDemo {
  constructor(root) {
    this.root = root;
    this.tabs = [...root.querySelectorAll('[role="tab"]')];
    this.panels = [...root.querySelectorAll('[role="tabpanel"]')];
    this.scenarios = this.panels.map(
      (panel) => new TrafficScenario(panel, panel.dataset.scenario),
    );
    this.tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => this.selectTab(index));
      tab.addEventListener('keydown', (event) =>
        this.onTabKeydown(event, index),
      );
    });
    this.frame = this.frame.bind(this);
    requestAnimationFrame(this.frame);
  }

  selectTab(index) {
    this.tabs.forEach((tab, tabIndex) => {
      const selected = tabIndex === index;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      this.panels[tabIndex].hidden = !selected;
    });
    this.scenarios[index].resize();
    this.tabs[index].focus();
  }

  onTabKeydown(event, index) {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    this.selectTab((index + direction + this.tabs.length) % this.tabs.length);
  }

  frame(now) {
    this.scenarios.forEach((scenario, index) =>
      scenario.tick(now, !this.panels[index].hidden),
    );
    requestAnimationFrame(this.frame);
  }
}

document
  .querySelectorAll('[data-traffic-demo]')
  .forEach((root) => new TrafficDemo(root));
