// ScPaging.java
package com.example.reactapt.config.DTO;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public record ScPaging<T>(
        List<T> collection,
        @JsonProperty("next_href") String nextHref,
        @JsonProperty("query_urn") String queryUrn,
        @JsonProperty("total_results") Integer totalResults
) {}
