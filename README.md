# site-info-api

使用方法示例：

https://site-info.vlts.cc/api/v1?url=https://xaoxuu.com

如果需要配置到 Stellar 主题中，写法就是：

```yaml
api: https://site-info.vlts.cc/api/v1?url=${href}
```

## 支持 Vercel 部署

1. fork 本仓库
2. 打开 vercel.com，部署该项目
3. 进入 Environment Variables 页面，设置 HOSTS 如下：

| Key | Value |
| :-- | :-- |
| HOSTS | `['', 'localhost', 'xaoxuu.com']` |

> 把示例中的最后一个修改为自己网站的 host 部分。
> 前两个分别代表空 Referrer、本地预览，可以根据需要选择是否保留。