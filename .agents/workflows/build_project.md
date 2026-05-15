# Build Project Workflow

This workflow describes the steps to install dependencies and build the MyGym project.

## Steps

1. **Install Dependencies**:
   Run the following command to install all necessary npm packages. 
   > [!IMPORTANT]
   > On Windows, native modules for Rollup and LightningCSS may need manual installation if the automatic install fails.
   ```powershell
   npm install
   # If native module errors occur (e.g., MODULE_NOT_FOUND for rollup or lightningcss):
   npm install @rollup/rollup-win32-x64-msvc lightningcss-win32-x64-msvc
   ```

2. **Build the Project**:
   Compile the React application using Vite.
   ```powershell
   npm run build
   ```
   The build artifacts will be located in the `dist/` directory.
