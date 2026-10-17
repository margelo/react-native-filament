package com.margelo.filament;

import android.os.Handler;
import android.os.HandlerThread;

import java.util.concurrent.Executor;

public class LooperExecutor implements Executor {
    private final Handler handler;

    public LooperExecutor(String name) {
        HandlerThread thread = new HandlerThread(name);
        thread.start();
        handler = new Handler(thread.getLooper());
    }

    @Override
    public void execute(Runnable runnable) {
        handler.post(runnable);
    }
}
