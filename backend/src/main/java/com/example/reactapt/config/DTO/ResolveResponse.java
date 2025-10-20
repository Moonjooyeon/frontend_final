package com.example.reactapt.config.DTO;

import java.util.List;

public record ResolveResponse(
        String type,              // "track" or "playlist" (그 외 raw)
        TrackDto track,
        String title,             // playlist title (playlist일 때)
        List<TrackDto> tracks
) {}