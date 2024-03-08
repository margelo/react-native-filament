package com.margelo.filament;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;

public class FilamentViewReadyEvent extends Event<FilamentViewReadyEvent> {
    FilamentViewReadyEvent(int surfaceId, int viewTag) {
        super(surfaceId, viewTag);
    }

    @Override
    public String getEventName() {
        return "filamentViewReady";
    }

    @Nullable
    @Override
    protected WritableMap getEventData() {
        return Arguments.createMap();
    }
}
