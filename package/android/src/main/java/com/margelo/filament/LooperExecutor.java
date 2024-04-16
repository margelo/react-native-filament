package com.margelo.filament;

import android.os.Handler;
import android.os.HandlerThread;

import java.util.concurrent.Executor;

public class LooperExecutor implements Executor {
    private final Handler handler;
    private final HandlerThread thread;

    public LooperExecutor(String name) {
        thread = new HandlerThread(name);
        thread.start();
        handler = new Handler(thread.getLooper());
    }

    @Override
    public void execute(Runnable runnable) {
        handler.post(runnable);
    }
}
