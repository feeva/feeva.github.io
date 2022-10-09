package mars.performance;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;

/**
 * 리스트와 맵의 데이터 찾기 성능 비교
 * 
 * @author 이동련(http://start.goodtime.co.kr)
 * @version 1.0
 */
public class ListVsMap {
    private static final char[] characters = new char[26 * 2];

    public static ArrayList<String> createStringList(int count) {
        ArrayList<String> l = new ArrayList<String>();

        for (int i = 0; i < count; ++i) {
            StringBuilder sb = new StringBuilder();
            int len = 3 + (int) (Math.random() * 14); // 최소 3, 최대 (3 + 13) 길이
            for (int j = 0; j < len; ++j)
                sb.append(characters[(int) (Math.random() * 52)]);
            l.add(sb.toString());
        }

        return l;
    }

    public static HashMap<String, Integer> createStringMap(ArrayList<String> list) {
        HashMap<String, Integer> map = new HashMap<String, Integer>();
        for (int i = 0; i < list.size(); ++i)
            map.put(list.get(i), i);

        return map;
    }

    public static void testString(int size) {
        ArrayList<String> list = createStringList(size);
        HashMap<String, Integer> map = createStringMap(list);

        long time = System.currentTimeMillis();
        for (int i = 0, count = size * 1000; i < count; ++i) {
            String key = list.get(i % size);
            for (String s : list) {
                if (key.equals(s))
                    break;
            }
        }
        System.out.println("비정렬 리스트 " + size + "개 검색: " + (System.currentTimeMillis() - time) + "ms");

        time = System.currentTimeMillis();
        Collections.sort(list);
        for (int i = 0, count = size * 1000; i < count; ++i) {
            String key = list.get(i % size);
            int index = Collections.binarySearch(list, key);
        }
        System.out.println("정렬 리스트 " + size + "개 검색: " + (System.currentTimeMillis() - time) + "ms");

        time = System.currentTimeMillis();
        for (int i = 0, count = size * 1000; i < count; ++i) {
            String key = list.get(i % size);
            Integer index = map.get(key);
        }
        System.out.println("맵 " + size + "개 검색: " + (System.currentTimeMillis() - time) + "ms");
    }

    public static ArrayList<Integer> createIntegerList(int size) {
        ArrayList<Integer> l = new ArrayList<Integer>();
        for (int i = 0; i < size; ++i) {
            l.add((int) (Math.random() * 1000000));
        }

        return l;
    }

    public static HashMap<Integer, Integer> createIntegerMap(ArrayList<Integer> list) {
        HashMap<Integer, Integer> map = new HashMap<Integer, Integer>();
        for (int i = 0; i < list.size(); ++i)
            map.put(list.get(i), i);

        return map;
    }

    public static void testInteger(int size) {
        ArrayList<Integer> list = createIntegerList(size);
        HashMap<Integer, Integer> map = createIntegerMap(list);

        long time = System.currentTimeMillis();
        for (int i = 0, count = size * 1000; i < count; ++i) {
            int key = list.get(i % size);
            for (Integer s : list) {
                if (key == s)
                    break;
            }
        }
        System.out.println("비정렬 리스트 " + size + "개 검색: " + (System.currentTimeMillis() - time) + "ms");

        time = System.currentTimeMillis();
        Collections.sort(list);
        for (int i = 0, count = size * 1000; i < count; ++i) {
            int key = list.get(i % size);
            int index = Collections.binarySearch(list, key);
        }
        System.out.println("정렬 리스트 " + size + "개 검색: " + (System.currentTimeMillis() - time) + "ms");

        time = System.currentTimeMillis();
        for (int i = 0, count = size * 1000; i < count; ++i) {
            int key = list.get(i % size);
            int index = map.get(key);
        }
        System.out.println("맵 " + size + "개 검색: " + (System.currentTimeMillis() - time) + "ms");
    }

    public static void main(String[] args) {
        // 알파벳 테이블 초기화
        for (int i = 'a'; i <= 'z'; ++i)
            characters[i - 'a'] = (char) i;
        for (int i = 'A'; i <= 'Z'; ++i)
            characters[26 + i - 'A'] = (char) i;

        System.out.println("String 리스트와 맵 비교");
        testString(10);
        testString(100);
        testString(1000);

        System.out.println();

        System.out.println("Integer 리스트와 맵 비교");
        testInteger(10);
        testInteger(100);
        testInteger(1000);
    }
}
