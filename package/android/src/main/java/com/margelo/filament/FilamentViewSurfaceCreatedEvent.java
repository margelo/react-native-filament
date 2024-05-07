package com.margelo.filament;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;

public class FilamentViewSurfaceCreatedEvent extends Event<FilamentViewSurfaceCreatedEvent> {

    public static final String EVENT_NAME = "filamentViewSurfaceCreated";

    FilamentViewSurfaceCreatedEvent(int surfaceId, int viewTag) {
        super(surfaceId, viewTag);
    }

    @Override
    public String getEventName() {
        return EVENT_NAME;
    }

    @Nullable
    @Override
    protected WritableMap getEventData() {
        return Arguments.createMap();
    }
}
