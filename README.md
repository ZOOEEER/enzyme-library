# Enzyme Library / 酶库

Enzyme Library is a local desktop tool for enzyme-related data entry, structured curation, CSV exchange, compound structure input, and whole-database validation.

GitHub: https://github.com/ZOOEEER/enzyme-library

## Features

- Local SQLite-backed enzyme data library.
- Tables for references, WT/parent enzymes, chemicals, reactions, conditions, WT experimental facts, engineering facts, and controlled vocabularies.
- CSV template download, current-table import/export, and full CSV export.
- Ketcher-based compound sketching and SMILES entry.
- Optional OCSR image recognition through a local Python / Pixi DECIMER runtime.
- Built-in help pages for user workflow, data model, and data persistence.

## Local development

```bash
npm install
npm run build:electron
```

On Windows, `run.bat` can be used to start the local development app.

Optional OCSR runtime setup:

```bash
pixi install
pixi run ocsr-install
pixi run ocsr-check
```

## Tests and build

```bash
npm run test
npm run build
npm run build:electron
```

## License

This project is source-available for learning, evaluation, development, research, and internal non-commercial use.

Commercial use, commercial distribution, SaaS/hosted services, commercial product integration, or paid third-party services require separate written authorization.

See [LICENSE.md](LICENSE.md).

Third-party dependencies are governed by their own licenses.
