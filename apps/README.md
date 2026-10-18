# Example apps

There are two example apps for the old arch (Paper) and the new arch (Fabric) respectively:
- AppExamplePaper
- AppExampleFabric

They share however none of the JS code. The JS code and assets are shared in the `Shared` folder. 
This is also the folder you have to start the metro bundler from.

Depending on which architecture you want to test you have to run the respective app.

## Notes

We are using yarn 3 workspaces for the example apps and the package. Note however the following gotchas:

- The `AppExamplePaper` is not hoisting (sharing) its packages like all the other packages in the workspace. This is because in react-native on android there is generated code located in the node_modules/ packages (e.g. for codegen). So each architecture needs to have their own set of native packages.