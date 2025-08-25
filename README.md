# 🥇 CrumbDB JS

Document DBMS in Javascript. Crumbdb JS is a Node.js-based minimalistic JSON database library that stores documents as individual JSON files. It supports safe concurrent access using async file locking and includes optional backup functionality via ZIP compression. CrumbDB is designed and built for solving a problem with data file size limits.

## 👨‍🏫 Notice

### 🎉 Releasing version 0.7.0

PLEASE USE THE LATEST VERSION.

- Upgraded `getMultiple()`, now it returns `{ data: {...}, meta: { DBNextPosition: position, DBEnd: true } }`.
- Added `getMultipleByKeyword()` and `getMultipleByKeywords()`
- `crumbFiles()` class is removed.
- Fixed algorithm for `getMultiple`, `getMultipleByKeyword()` and `getMultipleByKeywords()`

### 📢 Note

Nothing for now

## ▶️ Installation

```
npm i crumbdb
```

## 🔄 Testing

```
npm run test
```

## 📖 Documents

CrumbDB can be used for document database management.

### CrumbDB Examples

```
import { CrumbDB } from 'crumbdbjs';

// Need an instance that will manage file locking, you can pass number of file descriptor limit, default is 512
// For example, global.crumbdb = new CrumbDB(256);
global.crumbdb = new CrumbDB();

async function example()
{
    // Add data, return false when data exists
    await global.crumbdb.add(dirname, databasename, collectionname, documentname1, value1, encoding = 'utf8');
    await global.crumbdb.add(dirname, databasename, collectionname, documentname2, value2, encoding = 'utf8');

    // Update data, return false when data does not exist
    await global.crumbdb.update(dirname, databasename, collectionname, documentname1, value1, encoding = 'utf8');

    // Get data
    await global.crumbdb.get(dirname, databasename, collectionname, documentname1, encoding = 'utf8');

    // Get all data
    await global.crumbdb.getAll(dirname, databasename, collectionname, encoding = 'utf8')

    // Get multiple data
    await global.crumbdb.getMultiple (dirname, databasename, collectionname, position, count, encoding = 'utf8')

    // Remove data
    await global.crumbdb.remove (dirname, databasename, collectionname, documentname1)

    // Backup Data to a zip file
    await global.crumbdb.backup (sourceDir, zipPath)

    // Restore Data from a zip file
    await global.crumbdb.restore (zipPath, destDir)
}
```

## 💪 Support CrumbDB JS

### 👼 Become a Sponsor

- [Github sponsor page](https://github.com/sponsors/opdev1004)

## 👨‍💻 Author

[Victor Chanil Park](https://github.com/opdev1004)

## 💯 License

MIT, See [LICENSE](./LICENSE).
