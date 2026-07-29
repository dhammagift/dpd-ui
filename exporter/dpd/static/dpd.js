function playAudio(headword) {
    if (!headword) return;
    
    let gender = "male";
    try {
        const audioToggle = localStorage.getItem("audio-toggle");
        if (audioToggle === "true") {
            gender = "female";
        }
    } catch (e) {}

    // Убедитесь, что здесь указан полный URL к внешнему серверу
    const url = 'https://dpdict.net/audio/' + encodeURIComponent(headword) + '?gender=' + gender;
    
    var audio = new Audio(url);
    audio.play().catch(function (error) {
        console.error("Audio playback error:", error);
    });
}

// Делаем функцию доступной глобально
window.playAudio = playAudio;

// Слушатель кликов
document.addEventListener("click", function (event) {
    // 1. Ищем кнопку воспроизведения (поддерживаем оба класса)
    var playButton = event.target.closest(".button.play, .dpd-button.play");
    
    if (playButton) {
        var headword = playButton.getAttribute("data-headword");
        if (headword) {
            playAudio(headword);
            event.preventDefault();
            return false;
        }
    }

    // 2. Ищем обычные кнопки переключения (поддерживаем оба класса)
    var otherButton = event.target.closest(".button, .dpd-button");
    
    if (otherButton && otherButton.getAttribute("data-target")) {
        const target_id = otherButton.getAttribute("data-target");
        var target = document.getElementById(target_id);
        if (target) {
            let oneButtonToggleEnabled = false;
            try {
                oneButtonToggleEnabled = localStorage.getItem("one-button-toggle") === "true";
            } catch (e) {}

            if (oneButtonToggleEnabled) {
                // Снимаем активность со ВСЕХ кнопок обоих типов
                document.querySelectorAll('.button, .dpd-button').forEach(b => {
                    if (b !== otherButton) b.classList.remove("active");
                });
                document.querySelectorAll('.content').forEach(c => {
                    if (c !== target && !c.classList.contains("summary")) c.classList.add("hidden");
                });
            }
            target.classList.toggle("hidden");
            otherButton.classList.toggle("active");
        }
        event.preventDefault();
    }
});