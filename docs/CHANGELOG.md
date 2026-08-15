# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [v0.1.3] - 2026-08-16

### Changed
- Upgrade all libraries to latest version
- Pin PostgreSQL to a specific version in Docker setup

### Fixed
- Fix all Biome lint errors

## [v0.1.2] - 2025-08-28

### Added
- Makefile targets for release and changelog management

## [v0.1.1]

### Fixed
- Version alignment fixes

## [v0.1.0]

### Added
- Initial project setup
- Docker containerization
- Database migrations with Drizzle ORM
- User authentication system (register, login, logout, verify-email, forgot-password, reset-password, regenerate-access-token)
- Permission management system
- Posts CRUD with pagination
- CRUD generator scripts (`bun run generate <name>`)
- Winston logging with daily rotate
- OpenTelemetry tracer
- Verrou locking on auth, permission, and user-permission usecases
- Common regex patterns
- Environment flag to enable/disable encrypted responses
- Comprehensive Makefile automation
- Release management and changelog generation
- Response envelope (`handleResponse`) with status codes
