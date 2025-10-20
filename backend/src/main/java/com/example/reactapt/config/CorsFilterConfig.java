// src/main/java/com/example/reactapt/config/CorsFilterConfig.java
package com.example.reactapt.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.List;

@Configuration
public class CorsFilterConfig {
    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration cfg = new CorsConfiguration();
        // ✅ 모든 Origin 허용
        cfg.setAllowedOriginPatterns(List.of("*"));
        // ✅ 모든 헤더, 메서드 허용
        cfg.setAllowedHeaders(List.of("*"));
        cfg.setAllowedMethods(List.of("*"));
        // ✅ 쿠키/세션은 쓰지 않는다면 false
        cfg.setAllowCredentials(false);
        // (선택) 노출할 헤더 추가 가능
        // cfg.setExposedHeaders(List.of("Set-Cookie", "Location", "Content-Disposition"));

        UrlBasedCorsConfigurationSource src = new UrlBasedCorsConfigurationSource();
        src.registerCorsConfiguration("/**", cfg);
        return new CorsFilter(src);
    }
}
