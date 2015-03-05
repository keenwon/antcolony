# AntColony #

详细文档请查看 [http://keenwon.com/1436.html](http://keenwon.com/1436.html "http://keenwon.com/1436.html")  
  
AntColony（Github）是findit磁力搜索引擎的核心。用来在DHT网络中，收集活跃资源的infohash，下载并解析资源的种子文件，存入数据库等。AntColony是若干功能的合集，也可以单独运行其中的部分功能，所以起“蚁群”这个名字也是很贴切的（没错，我就是爱动物世界）。主要分一下几块：  
- worker：爬虫，收集资源infohash，可以同时启动多个进程的worker，提高效率  
- male：根据收集来的infohash去下载种子文件
- female：将种子文件录入数据库
- queen：简单的入口，启动pm2运行worker，male和female


