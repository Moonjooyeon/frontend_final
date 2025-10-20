package com.example.reactapt.config;
// config/ClientConfig.java

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class ClientConfig {
    @Bean
    public WebClient scClientV1(WebClient.Builder builder) {
        return builder
                .baseUrl("https://api.soundcloud.com")
                .build();
    }

    @Bean
    public String scClientId(@Value("${soundcloud.client-id}") String id) {
        if (id == null || id.isBlank()) {
            throw new IllegalStateException("SC_CLIENT_ID is missing");
        }
        return id;
    }
}
