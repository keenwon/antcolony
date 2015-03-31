# AntColony #

###介绍 
  
AntColony（Github）是findit磁力搜索引擎的核心。用来在DHT网络中，收集活跃资源的infohash，下载并解析资源的种子文件，存入数据库等。AntColony是若干功能的合集，也可以单独运行其中的部分功能，所以起“蚁群”这个名字也是很贴切的（没错，我就是爱动物世界）。主要分一下几块：  
- worker：爬虫，收集资源infohash，可以同时启动多个进程的worker，提高效率  
- male：根据收集来的infohash去下载种子文件
- female：将种子文件录入数据库
- queen：简单的入口，启动pm2运行worker，male和female

![](http://img.keenwon.com/2015/03/20150305144005_68120.png)


目前启动5个worker使用3000-3004的端口，2个male和1个female。  

使用Mongodb储存数据，这没什么好说的；使用pm2维护和监控node进程，也没太多要说的，重点说下Redis。Redis里暂存的数据大概是这样的：  

![](http://img.keenwon.com/2015/03/20150305144626_49722.png)
  
- bucket：比较大的一个K桶  
- infohash：就是已经收集到的infohashs（worker收集来的，male会用来下载种子）  
- remoteNodes：worker新认识的节点，会依次“拜访”的，目前只保存最新的10w个（一方面我的VPS内存小，另一方面真没必要记录太多）  
- sysInfo：记录一些统计信息，例如发出多少次请求，累积收集多少infohashs，目前已经发出15亿次Request，这个频率是可控的，worker 太疯狂的话，VPS扛不住。  
  
###安装方法
1. 安装node，pm2，redis，mongodb  
2. 执行`npm install` 下载依赖的包  
3. 修改`config.js`中相应的配置  
  
###运行方法
在根目录运行`node startup worker 3000`启动一个worker监听3000端口；运行`node startup male 1`启动id为1的male（female同理）。  

更多内容查看 [http://keenwon.com/1436.html](http://keenwon.com/1436.html "http://keenwon.com/1436.html")  
