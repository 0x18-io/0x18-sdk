# 0x18-sdk

## Testing package locally

To test package locally first run:

```
yarn build
```

This will build the package and add `dist` folder.

After that run:

```
npm pack --pack-destination ./
```

This will create `.tgz` file.

Then you can initialize a local project and import that `.tgz` as a local dependency in your `package.json`:

```
"dependencies": {
    "@0x18/0x18-sdk": "file:~/0x18-sdk-1.0.0.tgz"
}
```

Then run `npm install` and 0x18-sdk should be importable as a package.
