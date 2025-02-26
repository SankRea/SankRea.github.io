
const ap = new APlayer({
    container: document.getElementById('aplayer'),
    fixed: true,
    autoplay: false,
    audio: [
      {
        name: 'Ordinary day',
            artist: 'Melanie Penn',
			//  http://music.163.com/song/media/outer/url?id=  .mp3
            url: 'http://music.163.com/song/media/outer/url?id=3157058.mp3',
            cover: 'http://p1.music.126.net/X023gEyekdsS9_NZ0Nz_6g==/1656964023064581.jpg'
      },
      {
        name: 'Ordinary day',
            artist: 'Melanie Penn',
			//  http://music.163.com/song/media/outer/url?id=  .mp3
            url: 'https://m702.music.126.net/20250226113456/020acc6e9b1bad6ba4f35e34eddab9b5/jd-musicrep-ts/56bb/d95a/526a/26adf42f360d4c940db23ebf3af7a935.mp3?vuutv=MncY8flVGAlVkHrV6ToVGU7VLpS0fTV/BidHpw7hesC9nvpIlwMyDTy1l2uTdxCC2Tr0W6rs6HyW6v3FmSRcKZoDby5cxgAZaeb7pQLyDHfO4WmjNU+QzyW3kexOVFMRIq7gvaMB7q7M3dsFzfMo442jTfGk6EVJ0x2Lqntwk//YkJ9QvMq+6m9gQQWnq7z+yf9Lvj73CdrRgXzIKRV9xlwfqTw3VF0kinlXaoowqJpDUSjsFWQXQiuS5imDV3sLiF4eqHBgFdK3MWL3cO5Xedi0jWQJPJPQg5XMsqMuGc8HzMH4GMYrBPniH6jZsLy2WWSMXie7rBenLxg8hf6wFCwg6x8GJ6d4KquAeU57LBb5mJVIVSLekboUtVoz2wva',
            cover: 'http://p2.music.126.net/sCnY1zIvgMxz4rMSTYxc8A==/109951166126584886.jpg'
      }
    ]
});