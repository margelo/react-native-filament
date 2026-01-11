//
// Created by Hanno Gödecke on 11.01.26.
//

#if __has_include(<worklets/RunLoop/AsyncQueue.h>)
#include <worklets/RunLoop/AsyncQueue.h>
#elif __has_include(<RNWorklets/worklets/RunLoop/AsyncQueue.h>)
#include <RNWorklets/worklets/RunLoop/AsyncQueue.h>
#else
#error react-native-worklets Prefab not found!
#endif

#pragma once

namespace margelo {
    class RNFAsyncQueueImpl : public worklets::AsyncQueue {
    public:
        explicit RNFAsyncQueueImpl(std::shared_ptr<margelo::Dispatcher> dispatcher) : _dispatcher(std::move(dispatcher)) {}

        void push(std::function<void()> &&job) override {
            _dispatcher->runAsync(std::move(job));
        }

    private:
        std::shared_ptr<margelo::Dispatcher> _dispatcher;
    };
} // namespace margelo
