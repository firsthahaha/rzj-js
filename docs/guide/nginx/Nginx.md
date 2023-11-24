# Nginx的学习
当学习Nginx时，实际的配置和用例可以帮助你更好地理解各种概念。以下是一些简单的教学实例：

### 1. 静态文件服务

配置Nginx提供静态文件服务：

```nginx
server {
    listen 80;
    server_name example.com;

    location / {
        root /path/to/your/static/files;
        index index.html;
    }
}
```
这是一个基本的Nginx服务器块配置，它的作用是将针对 example.com 的 HTTP 请求引导到指定的静态文件目录。让我解释一下各个部分的含义：
1. **`server`块:**
   - 定义了一个Nginx服务器块。
```nginx
server {
    listen 80;
    server_name example.com;
    # ...
}
```
   - `listen 80;` 指定了Nginx监听的端口是80，这是HTTP通常使用的默认端口。
   - `server_name example.com;` 指定了该服务器块会处理发往 `example.com` 的请求。

2. **`location /`块:**
   - 定义了一个`location`块，它指定了对于URI路径 `/` 的请求的处理方式。

```nginx
location / {
    root /path/to/your/static/files;
    index index.html;
}
```

   - `root /path/to/your/static/files;` 设置了服务器上存放静态文件的根目录。当有请求访问根路径 `/` 时，Nginx将在这个根目录下查找文件。
   - `index index.html;` 指定了默认的索引文件是 `index.html`。如果访问的是一个目录而非具体的文件，Nginx将尝试寻找并返回该目录下的 `index.html` 文件。

综合起来，这个配置的作用是将来自 `example.com` 的 HTTP 请求（在80端口）引导到 `/path/to/your/static/files` 目录下，如果请求的是目录，会尝试返回该目录下的 `index.html` 文件。这是一个简单的静态文件服务的配置，适用于展示网站或者简单的Web应用。
### 2. 反向代理

配置Nginx作为反向代理，将请求代理到后端应用服务器：

```nginx
server {
    listen 80;
    server_name example.com;

    location / {
        proxy_pass http://backend_server;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```
这个配置是一个典型的Nginx反向代理配置。让我解释一下各个部分的含义：

```nginx
server {
    listen 80;
    server_name example.com;

    location / {
        proxy_pass http://backend_server;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

1. **`server`块:**
   - 定义了一个Nginx服务器块。

```nginx
server {
    listen 80;
    server_name example.com;
    # ...
}
```

   - `listen 80;` 指定了Nginx监听的端口是80，这是HTTP通常使用的默认端口。
   - `server_name example.com;` 指定了该服务器块会处理发往 `example.com` 的请求。

2. **`location /`块:**
   - 定义了一个`location`块，它指定了对于URI路径 `/` 的请求的处理方式。

```nginx
location / {
    proxy_pass http://backend_server;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

   - `proxy_pass http://backend_server;` 指定了反向代理的目标地址，即将这里的请求代理到 `http://backend_server`。
   - `proxy_set_header` 指令用于设置HTTP头信息，确保将原始请求的一些信息传递给后端服务器。这是为了在后端服务器能够获取到客户端的真实IP地址等信息。
     - `$host` 表示原始请求中的 `Host` 头信息。
     - `$remote_addr` 表示客户端的真实IP地址。
     - `$proxy_add_x_forwarded_for` 表示将客户端IP地址追加到 `X-Forwarded-For` 头信息中，以告知后端服务器请求的真实来源。

综合起来，这个配置的作用是将来自 `example.com` 的 HTTP 请求（在80端口）通过反向代理转发到 `http://backend_server`。这对于将Nginx用作应用服务器的前端代理非常常见，可以用于负载均衡、HTTPS终端等场景。

这个`location`块的作用是配置Nginx对以 `/aigcapi/` 开头的请求进行处理。让我解释其中的各个指令：

```nginx
location ~ /aigcapi/ {
    proxy_next_upstream     http_500 http_502 http_503 http_504 error timeout invalid_header;
    proxy_set_header        Host  e2e.atoms-api.jd.com;
    proxy_set_header        siteId  22;
    proxy_set_header        loginMode  0;
    proxy_set_header        X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_pass              http://e2e.atoms-api.jd.com;
    expires                 0;
    proxy_connect_timeout       300;
    proxy_send_timeout          300;
    proxy_read_timeout          300;
    send_timeout                300;
    client_max_body_size 1024M;
    client_body_temp_path /export/nginx_temp 1 2;
    log_by_lua ' jdn = require("stat"); jdn.log(); ';
}
```

1. **`location ~ /aigcapi/`：**
   - 使用`~`修饰符，表示使用正则表达式匹配URI路径，这里是匹配以 `/aigcapi/` 开头的请求。

2. **`proxy_next_upstream`：**
   - 定义了在发生特定错误时，Nginx应当尝试连接到下一个上游服务器。在这个例子中，当发生 HTTP 错误码为 500、502、503、504，或者超时、无效头等情况时，Nginx将尝试连接到下一个上游服务器。

3. **`proxy_set_header`：**
   - 设置了将被传递给后端服务器的HTTP头信息。
     - `Host e2e.atoms-api.jd.com;`：设置后端服务器的Host头信息。
     - `siteId 22;`：设置siteId头信息为22。
     - `loginMode 0;`：设置loginMode头信息为0。
     - `X-Forwarded-For $proxy_add_x_forwarded_for;`：将客户端的真实IP地址添加到 `X-Forwarded-For` 头信息中，以告知后端服务器请求的真实来源。

4. **`proxy_pass http://e2e.atoms-api.jd.com;`：**
   - 指定了代理请求的目标上游服务器地址。

5. **`expires 0;`：**
   - 禁用缓存，确保每个请求都会到后端服务器获取最新的数据。

6. **`proxy_connect_timeout`, `proxy_send_timeout`, `proxy_read_timeout`, `send_timeout`：**
   - 分别设置了连接超时、发送超时、读取超时和发送响应给客户端的超时时间，都被设置为300秒。

7. **`client_max_body_size 1024M;`：**
   - 设置客户端请求主体的最大尺寸为1024兆字节（1GB）。

8. **`client_body_temp_path /export/nginx_temp 1 2;`：**
   - 指定了存储客户端请求主体的临时文件路径。

9. **`log_by_lua ' jdn = require("stat"); jdn.log(); ';`：**
   - 使用Lua模块执行一个Lua脚本，用于记录日志或其他自定义操作。在这个例子中，似乎是调用了名为 "stat" 的Lua模块中的 "log" 函数。

总体而言，这个配置块的作用是将以 `/aigcapi/` 开头的请求通过代理转发到 `http://e2e.atoms-api.jd.com`，同时进行了一系列的头信息设置、超时设置等。

### 3. HTTPS配置

配置Nginx支持HTTPS：

```nginx
server {
    listen 80;
    server_name example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name example.com;

    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private-key.key;

    location / {
        root /path/to/your/static/files;
        index index.html;
    }
}
```
这个Nginx配置文件对 `example.com` 的请求进行了处理，其中包含HTTP到HTTPS的重定向以及HTTPS的配置。

1. **HTTP到HTTPS的重定向:**

```nginx
server {
    listen 80;
    server_name example.com;
    return 301 https://$host$request_uri;
}
```

   - `listen 80;` 指定了监听HTTP请求的端口为80。
   - `server_name example.com;` 指定了该服务器块会处理发往 `example.com` 的请求。
   - `return 301 https://$host$request_uri;` 意味着对于所有HTTP请求，Nginx将发送一个301永久重定向到相同的URI，但使用HTTPS协议。这样，用户访问HTTP的时候会被自动重定向到HTTPS。

2. **HTTPS的配置:**

```nginx
server {
    listen 443 ssl;
    server_name example.com;

    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private-key.key;

    location / {
        root /path/to/your/static/files;
        index index.html;
    }
}
```

   - `listen 443 ssl;` 指定了监听HTTPS请求的端口为443，同时启用SSL。
   - `server_name example.com;` 指定了该服务器块会处理发往 `example.com` 的请求。
   - `ssl_certificate` 和 `ssl_certificate_key` 指定了SSL证书和私钥的路径，用于启用HTTPS。
   - `location /` 块定义了对于URI路径 `/` 的请求的处理方式，这里是将请求映射到 `/path/to/your/static/files` 目录下，并尝试返回 `index.html`。

综合起来，这个配置确保 `example.com` 的所有HTTP请求都会被重定向到HTTPS，并在HTTPS上提供静态文件服务。此配置假设你已经有了有效的SSL证书和私钥。

### 4. 负载均衡

配置Nginx作为负载均衡器：

```nginx
http {
    upstream backend {
        server backend1.example.com;
        server backend2.example.com;
        # Add more backend servers as needed
    }

    server {
        listen 80;
        server_name example.com;

        location / {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
    }
}
```
这个Nginx配置文件实现了一个基本的反向代理，将来自 `example.com` 的HTTP请求代理到名为 `backend` 的上游服务器组。以下是配置文件的解释：

1. **`http`块:**
   - 定义了Nginx配置的顶层块，用于包含所有HTTP相关的配置。

```nginx
http {
    upstream backend {
        server backend1.example.com;
        server backend2.example.com;
        # Add more backend servers as needed
    }

    server {
        listen 80;
        server_name example.com;

        location / {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
    }
}
```

2. **`upstream`块:**
   - 定义了一个名为 `backend` 的上游服务器组。在这个例子中，包含了两个后端服务器 `backend1.example.com` 和 `backend2.example.com`。你可以根据需要添加更多的后端服务器。

```nginx
upstream backend {
    server backend1.example.com;
    server backend2.example.com;
    # Add more backend servers as needed
}
```

3. **`server`块:**
   - 定义了一个Nginx服务器块。

```nginx
server {
    listen 80;
    server_name example.com;

    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

   - `listen 80;` 指定了Nginx监听的端口是80，这是HTTP通常使用的默认端口。
   - `server_name example.com;` 指定了该服务器块会处理发往 `example.com` 的请求。

4. **`location /`块:**
   - 定义了一个`location`块，它指定了对于URI路径 `/` 的请求的处理方式。

```nginx
location / {
    proxy_pass http://backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

   - `proxy_pass http://backend;` 指定了代理请求的目标上游服务器地址，即之前定义的 `backend` 上游服务器组。
   - `proxy_set_header` 指令用于设置HTTP头信息，确保将原始请求的一些信息传递给后端服务器。
     - `$host` 表示原始请求中的 `Host` 头信息。
     - `$remote_addr` 表示客户端的真实IP地址。
     - `$proxy_add_x_forwarded_for` 表示将客户端IP地址追加到 `X-Forwarded-For` 头信息中，以告知后端服务器请求的真实来源。

综合起来，这个配置的作用是将来自 `example.com` 的 HTTP 请求（在80端口）通过反向代理转发到名为 `backend` 的上游服务器组中的其中一个后端服务器。
### 5. 基本的访问控制

限制特定路径的访问：

```nginx
server {
    listen 80;
    server_name example.com;

    location /private/ {
        deny all;
        return 403;
    }

    location / {
        root /path/to/your/static/files;
        index index.html;
    }
}
```
这个Nginx配置文件对 `example.com` 的请求进行了处理，其中包含了两个 `location` 块，分别处理不同的URI路径。

1. **`server`块:**
   - 定义了一个Nginx服务器块。

```nginx
server {
    listen 80;
    server_name example.com;
    # ...
}
```

   - `listen 80;` 指定了Nginx监听的端口是80，这是HTTP通常使用的默认端口。
   - `server_name example.com;` 指定了该服务器块会处理发往 `example.com` 的请求。

2. **`location /private/`块:**
   - 定义了一个`location`块，它指定了对于URI路径 `/private/` 的请求的处理方式。

```nginx
location /private/ {
    deny all;
    return 403;
}
```

   - `deny all;` 禁止所有对该路径的访问。
   - `return 403;` 返回HTTP状态码403，表示禁止访问。

3. **`location /`块:**
   - 定义了另一个`location`块，它指定了对于其他URI路径的请求的处理方式。

```nginx
location / {
    root /path/to/your/static/files;
    index index.html;
}
```

   - `root /path/to/your/static/files;` 设置了服务器上存放静态文件的根目录。当有请求访问根路径 `/` 或其他路径时，Nginx将在这个根目录下查找文件。
   - `index index.html;` 指定了默认的索引文件是 `index.html`。如果访问的是一个目录而非具体的文件，Nginx将尝试寻找并返回该目录下的 `index.html` 文件。

综合起来，这个配置的作用是：
- 对于以 `/private/` 开头的URI路径，禁止访问并返回HTTP 403错误。
- 对于其他URI路径，将请求映射到 `/path/to/your/static/files` 目录下，并尝试返回 `index.html`。这是一个简单的静态文件服务配置，同时限制了对 `/private/` 路径的访问。


这些例子涵盖了一些基本的Nginx配置，包括静态文件服务、反向代理、HTTPS配置、负载均衡以及基本的访问控制。你可以根据自己的需求和实际场景进行修改和扩展。逐步学习并在实践中应用这些配置，以便更好地理解Nginx的工作原理和功能。


这是一个Nginx配置文件，用于配置前端应用（可能是一个基于Angular、React或Vue等框架的单页应用）。以下是对该配置文件的详细解释：
```nginx
#path : /opt/nginx/conf/domains/frontend.jd.com
server
{
      listen 8080;
      access_log               /export/Logs/servers/nginx/logs/access.log main;
      error_log                /export/Logs/servers/nginx/logs/error.log warn;
      root /export/App/html;

      error_page 404 500 502 503 504 /50x.html;

      location = / {
        # 重定向到权限页面
        rewrite ^(.*)$  http://llm-adminyf.jd.com/admin/sysUser permanent;
      }

      location ~ /api/v1/ {
        proxy_next_upstream     http_500 http_502 http_503 http_504 error timeout invalid_header;
        proxy_set_header        Host  $host;
        proxy_set_header        X-Forwarded-For $proxy_add_x_forwarded_for;
        # http://xingyun.jd.com/jdosCD/ls/CI/llm-admin-backend
        proxy_pass              http://11.145.224.143;
        expires                 0;
        log_by_lua ' jdn = require("stat"); jdn.log(); ';
      }

      location ~ /admin/ {
        add_header  Content-Type 'text/html; charset=utf-8';
        alias /export/App/html/index.html;
        log_by_lua ' jdn = require("stat"); jdn.log(); ';
      }
      location = /admin/404.html {
        # 放错误页面的目录路径。
        root  /export/App/html;
      }
      location = /admin/403.html {
        # 放错误页面的目录路径。
        root  /export/App/html;
      }
      # for jdos2.0 nginx monitor
      location = /stat/service {
          access_by_lua_file lua/token.lua;
          content_by_lua '
              cjson = require("cjson")
              local res = {}
              res["data"] = "nginx-1.9.7"
              res["success"] = true
              ngx.say(cjson.encode(res))
          ';
      }
      # for jdos2.0 nginx monitor
      location = /stat/status {
          access_by_lua_file lua/token.lua;
          content_by_lua '
              cjson = require("cjson")
              jdn = require("stat");
              local res = {}
              res["data"] = jdn.stat()
              res["success"] = true
              ngx.say(cjson.encode(res))
          ';
      }
}
```

1. **`listen 8080;`：**
   - 指定Nginx监听的端口号为8080。

2. **`access_log` 和 `error_log`：**
   - 设置访问日志和错误日志的路径。

```nginx
access_log  /export/Logs/servers/nginx/logs/access.log main;
error_log   /export/Logs/servers/nginx/logs/error.log warn;
```

3. **`root /export/App/html;`：**
   - 指定了静态文件的根目录为 `/export/App/html`。

```nginx
root /export/App/html;
```

4. **`error_page`：**
   - 设置错误页面。

```nginx
error_page 404 500 502 503 504 /50x.html;
```

5. **`location = /`：**
   - 当访问根路径 `/` 时，重定向到权限页面。

```nginx
location = / {
    rewrite ^(.*)$  http://llm-adminyf.jd.com/admin/sysUser permanent;
}
```

6. **`location ~ /api/v1/`：**
   - 当请求路径匹配 `/api/v1/` 时，将请求代理到后端服务器。

```nginx
location ~ /api/v1/ {
    proxy_next_upstream     http_500 http_502 http_503 http_504 error timeout invalid_header;
    proxy_set_header        Host  $host;
    proxy_set_header        X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_pass              http://11.145.224.143;
    expires                 0;
    log_by_lua ' jdn = require("stat"); jdn.log(); ';
}
```

7. **`location ~ /admin/`：**
   - 当请求路径匹配 `/admin/` 时，返回前端应用的首页。

```nginx
location ~ /admin/ {
    add_header  Content-Type 'text/html; charset=utf-8';
    alias /export/App/html/index.html;
    log_by_lua ' jdn = require("stat"); jdn.log(); ';
}
```

8. **`location = /admin/404.html` 和 `location = /admin/403.html`：**
   - 设置 `/admin/404.html` 和 `/admin/403.html` 的位置。

```nginx
location = /admin/404.html {
    root  /export/App/html;
}

location = /admin/403.html {
    root  /export/App/html;
}
```

9. **`location = /stat/service` 和 `location = /stat/status`：**
   - 为JDOS 2.0的Nginx监控配置了两个路径。

```nginx
location = /stat/service {
    access_by_lua_file lua/token.lua;
    content_by_lua '
        cjson = require("cjson")
        local res = {}
        res["data"] = "nginx-1.9.7"
        res["success"] = true
        ngx.say(cjson.encode(res))
    ';
}

location = /stat/status {
    access_by_lua_file lua/token.lua;
    content_by_lua '
        cjson = require("cjson")
        jdn = require("stat");
        local res = {}
        res["data"] = jdn.stat()
        res["success"] = true
        ngx.say(cjson.encode(res))
    ';
}
```

这个配置文件的主要功能包括监听端口、设置静态文件根目录、配置错误页面、重定向、代理请求到后端服务器、返回前端应用的首页以及为JDOS 2.0的Nginx监控配置一些路径。