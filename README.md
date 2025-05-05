# 🥇 CrumbDB JS
Document DBMS in Javascript. Crumbdb JS is a Node.js-based minimalistic JSON database library that stores documents as individual JSON files. It supports safe concurrent access using async file locking and includes optional backup functionality via ZIP compression. CrumbDB is designed and built for solving a problem with data file size limits.

## 👨‍🏫 Notice

### 🎉 Releasing version 0.4.0
PLEASE USE THE LATEST VERSION.
- Changed function name `insert` to `add`
- `update` function is added to update data
- `restore` function is added to restore data from zip file

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
CrumbDB or CrumbFiles can be used for document database management.

### CrumbDB Examples
```
import { CrumbDB } from 'crumbdbjs';

// Need an instance that will manage file locking
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
### CrumbFiles Examples

```
import { CrumbFiles } from 'crumbdbjs';

// Need an instance that will manage file locking
global.crumbfiles = new CrumbFiles();

async function example()
{
    // Add data, return false when data exists
    await global.crumbfiles.add(dirname, documentname1, value1, encoding = 'utf8');
    await global.crumbfiles.add(dirname, documentname2, value2, encoding = 'utf8');

    // Update data, return false when data does not exist
    await global.crumbfiles.update(dirname, documentname1, value1, encoding = 'utf8');

    // Get data
    await global.crumbfiles.get(dirname, documentname1, encoding = 'utf8');
    
    // Get all data
    await global.crumbfiles.getAll(dirname, encoding = 'utf8')

    // Get multiple data
    await global.crumbfiles.getMultiple (dirname, position, count, encoding = 'utf8')

    // Remove data
    await global.crumbfiles.remove (dirname, documentname1)

    // Backup Data as a zip file
    await global.crumbfiles.backup (sourceDir, zipPath)

    // Restore Data from a zip file
    await global.crumbfiles.restore (zipPath, destDir)
}
```


## 💪 Support CrumbDB JS

### 👼 Become a Sponsor

- [Github sponsor page](https://github.com/sponsors/opdev1004)

## 👨‍💻 Author

[Victor Chanil Park](https://github.com/opdev1004)

## 💯 License

MIT, See [LICENSE](./LICENSE).
