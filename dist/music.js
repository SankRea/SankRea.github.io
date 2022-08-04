const ap = new APlayer({
    container: document.getElementById('aplayer'),
    fixed: true,
    autoplay: false,
    audio: [
      {
        name: 'stronger',
            artist: 'Kelly Clarkson',
			//  http://music.163.com/song/media/outer/url?id=  .mp3
            url: 'http://music.163.com/song/media/outer/url?id=26569168.mp3',
            cover: 'https://t14.baidu.com/it/u=2046206343,4206694074&fm=179&app=42&size=w931&n=0&f=JPEG&fmt=auto?s=4690EB2784EA47BF8995D0C80300B0F3&sec=1659718800&t=56d2323f7b2518de873bd2de533cec1f',
            lrc: 'lrc/Stronger-Kelly Clarkson.lrc'
      }
 
    
    ]
});