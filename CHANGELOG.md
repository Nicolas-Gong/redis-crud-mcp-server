# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-03-01

### Added
- Initial release
- Support for INI format configuration ([DATABASE] and [REDIS] sections)
- Support for standard KEY=VALUE format configuration
- Support for Cline and Claude Code platforms
- Complete Redis CRUD operations (SET, GET, DEL, EXISTS, LPUSH, RPUSH, LPOP, RPOP, LRANGE, LLEN, SADD, SREM, SMEMBERS, SISMEMBER, HSET, HGET, HGETALL, HDEL, ZADD, ZREM, ZRANGE)
- Support for multiple Redis database selection (SELECT/REDIS_DB)
- Flexible configuration name mappings
- Comprehensive error messages and documentation
- Configuration examples for both Cline and Claude Code

### Changed
- Improved error handling and user feedback

### Fixed
- Configuration parsing for various naming conventions
