# GitBook 中国加速计划

[![Build Status](https://travis-ci.org/sqrthree/GitBook-CDN-plan.svg?branch=master)](https://travis-ci.org/sqrthree/GitBook-CDN-plan)

> 由于某些原因，[GitBook](http://gitbook.com/) 的服务在国内访问一直断断续续、若即若离，体验十分之差，而对于一个面向文档编程的开发者来说，这是无法容忍的。因此就有了这么个计划。

简单的来说，就是将 [GitBook](http://gitbook.com/) 生成的静态内容托管至 [七牛云](https://www.qiniu.com/) 平台，借助于 [七牛云](https://www.qiniu.com/) 优秀的 CDN 服务来加速国内访问速度。

目前采用按需同步的方式，即程序会根据 [books](https://github.com/sqrthree/GitBook-CDN-plan/blob/master/books/) 目录下的配置文件同步设置好的任务至 [七牛云](https://www.qiniu.com/)。

如果你想要添加一个 [GitBook](http://gitbook.com/) 文档至该计划，欢迎提交 PR。

## 新加一个任务

1. 请在添加之前请先确认是否已经存在相关任务。

2. 在 [books](https://github.com/sqrthree/GitBook-CDN-plan/blob/master/books/) 文件夹下创建一个新文件，文件名为 `[GitHub 用户名]-[Repo 名].json`，并设置以下内容:

    ```
    {
      "title": "Book 描述",
      "repo": "GitHub repo 地址，格式为：user/repo",
      "branch": "分支名",
      "docs_dirname": "文档目录，默认为 repo 根目录",
      "original_url": "原 GitBook 的链接"
    }
    ```
3. 如有疑问，请参考 [github.com/sqrthree/GitBook-CDN-plan/blob/master/books/sqrthree-codewars.json](https://github.com/sqrthree/GitBook-CDN-plan/blob/master/books/sqrthree-codewars.json)

## 目前已有文档列表

<!--list-start-->
- [reactjs/redux](http://op6gls4d1.bkt.clouddn.com/reactjs-redux/) - Redux 官方英文文档
- [sqrthree/codewars](http://op6gls4d1.bkt.clouddn.com/sqrthree-codewars/) - 我的代码战争
- [vuejs/vuex](http://op6gls4d1.bkt.clouddn.com/vuejs-vuex/docs) - vuex 官方文档
<!--list-end-->

## 致谢

感谢 [GitBook](http://gitbook.com/) 和 [七牛云](https://www.qiniu.com/) 为开发者提供如此优秀的服务。也感谢每一个文档的作者的无私奉献。
