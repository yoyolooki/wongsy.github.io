document.addEventListener('DOMContentLoaded', () => {
    const audioPlayer = document.getElementById('audio-player');
    const audioSource = document.getElementById('audio-source');
    const musicNameSpan = document.getElementById('current-music-name');

    // 音乐文件路径
    const musicFileName = '../music/Dont Call It Puppy Love.mp3'; // 替换为你的音乐文件名
    const musicFilePath = `${musicFileName}`;

    // 设置音频源
    audioSource.src = musicFilePath;
    audioPlayer.load();

    // 显示音乐名称
    musicNameSpan.textContent = musicFileName;
});
