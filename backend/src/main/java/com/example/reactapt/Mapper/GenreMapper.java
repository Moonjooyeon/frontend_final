package com.example.reactapt.Mapper;
import java.util.Map;

public class GenreMapper {
    private static final Map<String, String> MAP = Map.of(
            "hiphop", "hip hop",
            "k-pop", "kpop",
            "all-music", "" // 전체 검색 느낌
    );

    public static String toKeyword(String slug) {
        return MAP.getOrDefault(slug, slug.replace('-', ' '));
    }
}
