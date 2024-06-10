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

Check database data

```sh
bun drizzle-kit studio
```

### Docker

Build

```sh
docker build -t flawiddsouza/general-tester:0.0.1 .
```

Run

```sh
docker run --name general-tester -it -p 9002:9002 flawiddsouza/general-tester:0.0.1
```
