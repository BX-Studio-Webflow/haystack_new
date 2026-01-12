// const path = require("path");
// const fs = require("fs");

// // Function to get all TypeScript files in the src directory
// const getEntryPoints = () => {
//   const srcDir = path.resolve(__dirname, "src");
//   const files = fs.readdirSync(srcDir);

//   const entry = {};
//   files.forEach((file) => {
//     if (file.endsWith(".ts")) {
//       const name = path.basename(file, ".ts");
//       entry[name] = path.resolve(srcDir, file);
//     }
//   });

//   return entry;
// };

// module.exports = {
//   entry: getEntryPoints(),
//   output: {
//     path: path.resolve(__dirname, "dist"),
//     filename: "[name].js",
//     libraryTarget: "var",
//     library: "[name]",
//   },
//   module: {
//     rules: [
//       {
//         test: /\.ts$/,
//         use: "ts-loader",
//         exclude: /node_modules/,
//       },
//     ],
//   },
//   resolve: {
//     extensions: [".ts", ".js"],
//   },
//   optimization: {
//     splitChunks: false, // Disable code splitting
//   },
//   mode: "production", // or 'development' based on your needs
// };

// const path = require("path");
// const fs = require("fs");

// // Recursive function to get all TypeScript files in a directory
// const getFilesRecursively = (dir, fileList = []) => {
//   const files = fs.readdirSync(dir);

//   files.forEach((file) => {
//     const filePath = path.join(dir, file);
//     if (fs.statSync(filePath).isDirectory()) {
//       getFilesRecursively(filePath, fileList);
//     } else if (file.endsWith(".ts")) {
//       fileList.push(filePath);
//     }
//   });

//   return fileList;
// };

// // Function to generate entry points from TypeScript files
// const getEntryPoints = () => {
//   const srcDir = path.resolve(__dirname, "src");
//   const tsFiles = getFilesRecursively(srcDir);

//   const entry = {};
//   tsFiles.forEach((file) => {
//     const relativePath = path.relative(srcDir, file);
//     const name = path.basename(file, ".ts");
//     const entryPath = path.resolve(srcDir, relativePath);
//     entry[name] = entryPath;
//   });

//   return entry;
// };

// module.exports = {
//   entry: getEntryPoints(),
//   output: {
//     path: path.resolve(__dirname, "dist"),
//     filename: "[name].js",
//     libraryTarget: "var",
//     library: "[name]",
//   },
//   module: {
//     rules: [
//       {
//         test: /\.ts$/,
//         use: "ts-loader",
//         exclude: /node_modules/,
//       },
//     ],
//   },
//   resolve: {
//     extensions: [".ts", ".js"],
//   },
//   optimization: {
//     splitChunks: false, // Disable code splitting
//   },
//   mode: "production", // or 'development' based on your needs
// };

const path = require("path");
const fs = require("fs");

// Recursive function to get all TypeScript files in a directory
const getFilesRecursively = (dir, fileList = []) => {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFilesRecursively(filePath, fileList);
    } else if (file.endsWith(".ts")) {
      fileList.push(filePath);
    }
  });

  return fileList;
};

// Function to generate entry points from TypeScript files
const getEntryPoints = () => {
  const srcDir = path.resolve(__dirname, "src");
  const tsFiles = getFilesRecursively(srcDir);

  const entry = {};
  tsFiles.forEach((file) => {
    const relativePath = path.relative(srcDir, file);
    const name = path.relative(srcDir, file)
      .replace(/\.ts$/, "")
      .replace(/[\\/]/g, "/"); // replace slashes
    const entryPath = path.resolve(srcDir, relativePath);
    entry[name] = entryPath;
  });

  return entry;
};

module.exports = {
  entry: getEntryPoints(),
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
    // Preserve directory structure by using [name].js
    // which will use the key name from the entry object
    libraryTarget: "umd",
    library: "[name]",
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  optimization: {
    splitChunks: false, // Disable code splitting
    // minimize: false,
  },
  devServer: {
    static: {
      directory: path.resolve(__dirname, "dist"),
    },
    compress: true,
    hot: true,
    port: 8080,
    open: false,
    allowedHosts: "all",
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  },
  mode: "production", // or 'development' based on your needs
};
