# HTML 资源多选标签兼容

本地已实现并验证，未部署。分支 codex/html-resource-multi-tags 基于 feature-refactor，与 engine_skeleton 的 hotfix-uploadsrc 配套。

Forge 将各分类的所有选项和自定义词放入 tags，保留第一学科/年级作为标量兼容字段。门户 internal works API 现在去重后接收最多 64 项，不再静默截断为 8 项；学科、年级、学段查询增加 tags 成员匹配，同维度 OR、跨维度 AND 不变，旧单值作品兼容。无需数据库迁移。须先部署门户更新，再部署 Forge 多选编辑版本。

验证：node --test tests/teacher-plaza-filters.test.mjs（6 项）；npx tsc --noEmit --incremental false，均通过。未改变生产配置、既有用户作品或登录机制。
