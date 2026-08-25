# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup
- Docker containerization
- Database migrations with Drizzle ORM
- User authentication system
- Permission management system
- Comprehensive Makefile automation
- Release management and changelog generation

### Changed
### Deprecated
### Removed
### Fixed
### Security

## [v0.1.0]

- chore: bump version to v0.1.0
- chore: bump version to v0.0.3
- chore: bump version to v0.0.2
- docs(readme): update project information
- chore: bump version to v0.0.1
- chore(make): setup make for release and changelog
- chore(make): MakeFile for unified project command
- feat(validation): changes from invalid email to invalid credentials
- feat(app): add OpenTelemetry tracer
- feat(app): add verrou locking on permission and user permission, remove unnecessary encrypt
- feat(app): add verrou locking on auth usecase
- feat(app): add common regex pattern
- feat(app): update usecase to using getUser for check user info
- feat(app): add env to enable/disable encrypt response
- refacto(app): update logger and handleResponse
- style(app): remove semicolon
- style(app): remove semicolon
- feat(usecase): update permission usecase
- feat(app): remove unused pkg and code
- feat(app): update post src
- feat(db): change timestamp with time zone to just timestamp
- feat(logging): winston logging daily rotate
- feat(test): update test for permission
- feat(app): remove unused code and update enum
- feat(app): update generate script
- feat(app): generator scripts for src, db, test
- feat(app): permission routes and routes test case
- feat(app): add permission routes and update testcase
- feat(test): add test case for posts routes
- feat(post): update posts usecase
- feat(general): update general usecase
- feat(utils): update crypto, encryp & decrypt response
- feat(src): update response hand queryFn
- feat(post): refactor handle response
- feat(auth): refactor handle response
- test(auth): routes auth testing
- feat(app): improve handle error and refactor logic on usecase
- docs(README.md): initial project docs
- chore(app): generate schema.svg on db:diagram
- feat(model): update readAllPost model
- feat(app): using scope validation on CRUD post
- feat(app): using scope validation
- feat(app): scope and scope_user_permission table and sorting query
- feat(app): users management
- chore(app): remove unused code and file
- chore(app): remove unused code
- feat(app): add CORS .env
- chore(app): remove db:studio script
- feat(db): improve schema
- feat(src): add verify-permission general usecase
- feat(app): change to ULID for id generator
- feat(app): change to ioredis and use verrou for locking
- feat(db): update user schema and naming file db
- chore(vscode): update vscode settings
- feat(db): update schema and script
- feat(app): reset password and improve dx
- feat(app): init redis, update docker compose, and env.example
- feat(app): read one and delete post
- feat(app): forgot and reset password
- feat(app): register, verify emaiil, and update schema + db
- feat(db): utils for drop db data and update seed
- feat(app): permission and user_permission for PBAC
- feat(post): update post
- feat(post): read all post
- feat(utils): update encrypt-response to support pagination
- feat(utils): pagination on general-response
- feat(server): cleaner route and handle onError
- feat(post): update usecase and handle create post
- feat(auth): update usecase and route
- feat(utils): crypto and encrypted response
- feat(common): general-response model
- feat(db): update user seeder
- feat(env): add SECRET_KEY env for encrypt key
- feat(db): update post schema and seeder
- db(schema): update relations and add diagram generator
- db(schema): update fk for related schema
- chore(app): update package.json
- db(seed): using Bun password hashing on user seed
- feat(db): update schema for posts
- feat(usecase): initial logout usecase
- feat(usecase): login usecase update checking session
- db(migrations): new migrations based on sessionId change on refresh_token table
- feat(app): the beginning

## [v0.1.1]

- chore: bump version to v0.1.1

## [v0.1.2]

- chore: bump version to v0.1.2
- chore(make): setup make for release and changelog

## [v0.1.3]

- chore: bump version to v0.1.3
- style(lint): fix all biome lint errors
- chore(deps): upgrade all libraries to latest
- build(docker): update postgre to spesific version

## [v0.1.4]

- chore: bump version to v0.1.4
- refactor(permissions): drop IN subquery from verifyPermission
- feat(pagination): page=-1 returns all records without limit
- feat(validation): enforce query param constraints in read-all models
- feat(validation): enforce ULID id format in data models
- refactor(types): enum-typed post fields, unified listing contract
- fix(auth): unpack verrou results, session helper, close leaks
- refactor: unify ServiceError, thin handler factory, collapse auth pipeline
- feat(users): wrap create-user inserts in a DB transaction
- refactor: add Effect service layer to permissions, users, user-permissions
- feat(posts): add Effect service layer with per-operation service files
- refactor: migrate users and user-permissions to requirePermission pattern
- fix(security): move OTLP Axiom token to environment config
- refactor: extract auth guard plugin and pagination helper
- refactor: apply thermo-nuclear review findings
- chore: remove CRUD generator and update README
- refactor(test): guard-clause permission setup without else
- fix(docker): repair production image for bun.lock and runtime deps
- build: upgrade Biome to 2.5.8 and enforce no-ternary/no-else style
- refactor(imports): change all relative imports to absolute paths
- docs(changelog): update changelog for v0.1.3

## [v0.1.5]

- chore: bump version to v0.1.5
- refactor(posts): extract scopeWhere helper
- docs(changelog): update changelog for v0.1.4

## [v0.1.6]

- chore: bump version to v0.1.6
- fix(infra): wire REDIS_PORT through config into redis client
- fix(users): sign email-verification token with JWT_EMAIL_SECRET
- refactor(auth): migrate routes to Effect service layer
- feat(app): Stricted rules code

