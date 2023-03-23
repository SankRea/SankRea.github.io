
const ap = new APlayer({
    container: document.getElementById('aplayer'),
    fixed: true,
    autoplay: false,
    audio: [
      {
        name: 'ふわふわ♪',
            artist: '牧野由依',
			//  http://music.163.com/song/media/outer/url?id=  .mp3
            url: 'http://music.163.com/song/media/outer/url?id=609890.mp3',
            cover: 'http://p1.music.126.net/I31NLw0rw2kPh_nakck9Jw==/109951166200147817.jpg'
      },
      {
        name: 'stronger',
            artist: 'Kelly Clarkson',
			//  http://music.163.com/song/media/outer/url?id=  .mp3
            url: 'http://music.163.com/song/media/outer/url?id=26569168.mp3',
            cover: 'https://t14.baidu.com/it/u=2046206343,4206694074&fm=179&app=42&size=w931&n=0&f=JPEG&fmt=auto?s=4690EB2784EA47BF8995D0C80300B0F3&sec=1659718800&t=56d2323f7b2518de873bd2de533cec1f'
      },
      {
        name: 'Ordinary day',
            artist: 'Melanie Penn',
			//  http://music.163.com/song/media/outer/url?id=  .mp3
            url: 'http://music.163.com/song/media/outer/url?id=3157058.mp3',
            cover: 'http://p1.music.126.net/X023gEyekdsS9_NZ0Nz_6g==/1656964023064581.jpg'
      },
      {
        name: '错过的烟火',
            artist: '周杰伦',
			//  网易云为第一方案，当网易云无法使用就上传到onedrive，利用共享链接转换后使用
      // 转换链接：https://onedrive.gimhoy.com/
            url: 'https://link.jscdn.cn/1drv/aHR0cHM6Ly8xZHJ2Lm1zL3UvcyFBbHN6WUNDTGFTVURpWE0tRk1CVXlQZVktX2VHP2U9OXk3QktC.flac',
            cover: 'http://p2.music.126.net/VldbGI7kjph0TeIbttQHGQ==/109951167672625652.jpg'
      },
      
      {
        name: '富士山下',
            artist: '陈奕迅',
			//  http://music.163.com/song/media/outer/url?id=  .mp3
            url: 'http://music.163.com/song/media/outer/url?id=1846519326.mp3',
            cover: 'http://p2.music.126.net/39Wb7Nm5AZMi4RtKWIK7Mg==/109951165995189664.jpg'
      },
      {
        name: 'Viva La Vida (feat. Daniele Vitale SAX)',
            artist: 'Karolina Protsenko / Daniele Vitale Sax',
			//  http://music.163.com/song/media/outer/url?id=  .mp3
            url: 'http://music.163.com/song/media/outer/url?id=1902474653.mp3',
            cover: 'http://p1.music.126.net/Lt6Z9POY1UFTycB4xcq-wQ==/109951166715668368.jpg'
      }
 
    
    ]
});