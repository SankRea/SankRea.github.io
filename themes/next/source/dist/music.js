
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
        name: 'Sweet Revenge (feat. yoxen)',
            artist: 'Tielle / yoxen',
			//  http://music.163.com/song/media/outer/url?id=  .mp3
            url: 'https://m702.music.126.net/20250226113456/020acc6e9b1bad6ba4f35e34eddab9b5/jd-musicrep-ts/56bb/d95a/526a/26adf42f360d4c940db23ebf3af7a935.mp3?vuutv=MncY8flVGAlVkHrV6ToVGU7VLpS0fTV/BidHpw7hesC9nvpIlwMyDTy1l2uTdxCC2Tr0W6rs6HyW6v3FmSRcKZoDby5cxgAZaeb7pQLyDHfO4WmjNU+QzyW3kexOVFMRIq7gvaMB7q7M3dsFzfMo442jTfGk6EVJ0x2Lqntwk//YkJ9QvMq+6m9gQQWnq7z+yf9Lvj73CdrRgXzIKRV9xlwfqTw3VF0kinlXaoowqJpDUSjsFWQXQiuS5imDV3sLiF4eqHBgFdK3MWL3cO5Xedi0jWQJPJPQg5XMsqMuGc8HzMH4GMYrBPniH6jZsLy2WWSMXie7rBenLxg8hf6wFCwg6x8GJ6d4KquAeU57LBb5mJVIVSLekboUtVoz2wva',
            cover: 'http://p2.music.126.net/sCnY1zIvgMxz4rMSTYxc8A==/109951166126584886.jpg'
      },
      {
        name: '永世のクレイドル',
            artist: '鈴華ゆう子',
			//  http://music.163.com/song/media/outer/url?id=  .mp3
            url: 'https://m702.music.126.net/20250226114216/6a99ba6fcd0b251cc30b549c109ecee9/jd-musicrep-ts/a28b/dc21/c957/bd27ceb35e389ee46f14835ea854c84f.mp3?vuutv=EzOVCYEhZMzt2iAGT5teYhN3c7IYESBpKzttA1VDJF8LeFARhZjUoZXp+vAZAKupLExvFAVYjXq5lVD0iqMD3G+XVUF0t/Ot5v8bvEl2LYxivAr3c8zpzCU4ZRLHN8iK596ixESa6GhGnpjOArBhY6hga9Ms2/KxkJjMWwGg0sFSXwSti3cYbg+Cf2nY0HxDtXUKY2kRyiDj5H3YelrBCqPm3yFt65tpWI5NB1K1+9UTKOu0omSxYIMsAnySSDGlYwdJiSK7ImFwKlmI9PDaQMFOqVNSdgKX9t7/HTt06dl/aveAlMlmySyBKYRFCiGl/v0pEI6+Ffcn+WQzTT0ImhY/vbmgBi9Df3d3GELkAER9wU9n0u4LPpRF3vwir+jl',
            cover: 'https://p3.music.126.net/XRszD1nA6wE8gCM74EnSuQ==/18690598162274789.jpg?param=300y300'
      },
      {
        name: '届かない恋',
            artist: '上原れな',
			//  http://music.163.com/song/media/outer/url?id=  .mp3
            url: 'https://m801.music.126.net/20250226114434/747f783f01c8acb6874bdbf40600cdcb/jdymusic/obj/wo3DlMOGwrbDjj7DisKw/29521273461/ee1d/bac7/ef72/050b3a1f2298fd75f6702b1ff36268fc.mp3?vuutv=f2sObsC1HVWbLP4veBnz8nSaSxrKX1/tEFtBFAqXPaE3iXAbcHvjdTH9g/qpmBt6SBm8RnVjWa/JSGLQL5yDcc4H00wHPxYDRb1X0KfbbQu5akGDgqPIPYMVDJ12HXd9oVV19kqEoDHW2qATDCA4wbSDXk2UAsxKvBn6n9bQ4VcXDSZ1zuHAGMqDJ9h7kj8Fw6+soc3gMfcoNKBfe7tB53NAs+6/Aee8OXN5CGMRlX01ZSGBitsma9cWW6/WMh9SLH2gX7+RWv8navA7QE+uHZBCSKTnfg8NGWo8W+J0G7XrEpOkmISKDXCE1ORbbzXGMi/eLPKO1puloI2k2exD5U9O+Wd8UIk9hWQ5Gy506SwPtdfWDxsqmpaJFmGKtFyQ',
            cover: 'https://p3.music.126.net/ozuRgw3PHm3kI9760pN0UA==/109951168761255272.jpg?param=300y300'
      },
      {
        name: 'The Ocean (Radio Edit)',
            artist: 'Mike Perry',
			//  http://music.163.com/song/media/outer/url?id=  .mp3
            url: 'https://m802.music.126.net/20250226115034/56814199f5afda98d3ee6561ac364ecc/jd-musicrep-ts/748c/6711/fdbc/5cfac7777e1123305e085f1397617fc3.mp3?vuutv=CqH00P6rqQCat6Ln4KSpWik5Mmide1lhccHeVcg7+k0I0JTjwyesAOTcx3CxYQMjCS9jVp2UpS5B/VDA9NW3nDtk8dvFbn81CWPuVa7wV85W9X7pRT0pBCXxJ9bu3Wdw/oQsLo9jhMHhvaXo/+dEdikpnSZ3M39kX+5subCE7HUrv6HLX8HEvuVjCrNqHvH2FZAM2OKHu4VzNNtMUY1nw8A3Gm5MfNytUIUZoNmZ7Vafa6mVKk1h/b/ZRTma1IAhi+jnordQo4/XTs/+y/CoQgvEYx3nk5QtvUY1rY5QmuQENHM3N4FLNLM+D4Tjdi1aPCkORMQIQ2PVLfcKim4MPTonL488brRkYAFFKMWwAeDyIfmmMuhXlc5sGZ34Tln3',
            cover: 'https://p3.music.126.net/5sPUycjuzur98eLFOEirhw==/109951165975333597.jpg?param=300y300'
      }
    ]
});