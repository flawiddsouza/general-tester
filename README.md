# General Tester

## Development

### ui

```sh
bun dev
```

Navigate to http://localhost:5173

### api

#### Running

```sh
bun dev
```

Navigate to http://localhost:9002

#### Migrations

Generate migrations from schema.ts

```sh
bun drizzle-kit generate --name your_migration_name
```

Run generated migrations

```sh
bun drizzle-kit migrate
```
