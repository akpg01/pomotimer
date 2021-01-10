// UI controller
var UIController = (function() {
    var DOMstrings = {
        minutes: '#mins',
        seconds: '#secs',
        icons: '#pom_icons',
        startbutton: '.start',
        pausebutton: '.pause',
        stopbutton: '.stop',
        status: '#status',
        audio: '#pop',
        duration: '#duration',
        break: '#break',
        longBreak: '#long_break',
        playlist: '#playlist',
        volume: '#vol',
        settings: '#pom-settings',
        ok: '#set-settings',
        soundTest: '#test_sound',
        filler: '#filler'
    };
    return {
        getDOMstring: function() {
            return DOMstrings;
        }
    };
})();

// Sound
var AUD = (function(pomUICtrl) {
    var DOM = pomUICtrl.getDOMstring();
    var totalTracks = 0,
        el, vl, currentPos, volPos;
    var player = document.querySelector(DOM.audio);

    var setupEventListeners = function() {
        // select items from the playlist
        document.querySelector(DOM.playlist).addEventListener('change', function() {
            el = document.querySelector(DOM.playlist);
            currentPos = el.options.selectedIndex;
            AUD.setTrack();
        });

        // select volume level
        document.querySelector(DOM.volume).addEventListener('change', function() {
            vl = document.querySelector(DOM.volume);
            volPos = vl.options.selectedIndex;
            AUD.setTrack();
        });
    };
    return {
        init: function() {
            // get the volume level from the dropdown list
            vl = document.querySelector(DOM.volume);

            // get the title of song from the dropdown list
            el = document.querySelector(DOM.playlist);

            // index of item selected
            currentPos = el.options.selectedIndex;
            volPos = vl.options.selectedIndex;

            player.volume = parseFloat(vl.options[volPos].value / 100);

            player.src = el.options[currentPos].value;

            // the number number of element in a drop down list
            totalTracks = document.getElementById('playlist').length;

            // set up event listeners
            setupEventListeners();
        },
        setTrack: function() {

            // index of item selected
            currentPos = el.options.selectedIndex;
            volPos = vl.options.selectedIndex;

            document.querySelector(DOM.playlist)[currentPos].selected = 'selected';

            // get the title of the song from the dropdown list
            el = document.querySelector(DOM.playlist);

            // get the volume level from the dropdown list
            vl = document.querySelector(DOM.volume);

            // set volume level of player
            player.volume = parseFloat(vl.options[volPos].value / 100);

            // set song track of player
            player.src = el.options[currentPos].value;

            return Array(currentPos, volPos);
        },

        // test sound 
        soundTest: function() {
            var elem, pos;
            elem = document.querySelector(DOM.playlist);
            pos = elem.options.selectedIndex;

            player.src = elem.options[pos].value;
            player.load();
            player.play();

        },
        getAUD: function() {
            // set track
            AUD.setTrack();
            player.load();
            player.play();
        }
    };
})(UIController);

var pomodoro_app = (function(pomUICtrl, AUDCtrl) {
    var DOM = pomUICtrl.getDOMstring();
    var mins, secs, pomDuration, pomSB, pomLB, estPoms, timerIntID = null,
        timerRunning = false,
        work = true,
        index = 0, // tracks number of pomodoros completed
        maxCount = 4,
        fillerHeight = 0,
        compPoms = 0,
        begColor = 0,
        fillerIncrement = 0;

    // initialize right after start of application
    var setupEventListeners = function() {
        var DOM = pomUICtrl.getDOMstring();

        // set duration of pomodoro
        document.querySelector(DOM.duration).addEventListener('change', function() {
            pomDuration = document.querySelector(DOM.duration).value;
            pomodoro_app.setDurations();
        });

        // set short break duration of pomodoro
        document.querySelector(DOM.break).addEventListener('change', function() {
            pomSB = document.querySelector(DOM.break).value;
            pomodoro_app.setDurations();
        });

        // set long break duration of pomodoro
        document.querySelector(DOM.longBreak).addEventListener('change', function() {
            pomLB = document.querySelector(DOM.longBreak).value;
            pomodoro_app.setDurations();
        });
    };

    var countDownTimer = function() {
        mins = parseInt(document.querySelector(DOM.minutes).innerText, 10);
        secs = parseInt(document.querySelector(DOM.seconds).innerText, 10);

        if (secs > 0) {
            mins = zeros(mins);
            secs = zeros(secs - 1);
        } else {
            if (mins > 0) {
                mins = zeros(mins - 1);
                secs = "59";
            } else if (mins === 0 && secs === 0) {
                AUDCtrl.getAUD(); // play sound
                updateStatus("Time is Up!");
                timeEnded();
                return;
            } else {
                mins = zeros(mins);
                secs = zeros(secs);
            }
        }
        updateDOM(mins, secs);
    };

    var timeEnded = function() {
        if (work) {
            index++; // keeps track of the number work cycles complete--used to determine when breaks occur
            compPoms++; // increment number of completed pomodoro

            colorPoms(begColor, compPoms); // color pomodoro
            // console.log('current: index: ' + index);
            if (index === maxCount) {
                index = 0;
                fillerIncrement = 200 / (parseInt(pomLB, 10) * 60);
                updateStatus("Long break!");
                updateDOM(zeros(pomLB), zeros(0));
            } else {
                fillerIncrement = 200 / (parseInt(pomSB, 10) * 60);
                updateStatus("Short break!");
                updateDOM(zeros(pomSB), zeros(0));
            }
            $('#pause').attr('disabled', true).addClass('ui-state-disabled');
            work = false;
        } else if (!work) {
            fillerHeight = 0;
            fillerIncrement = 0;
            // enable start button
            $("#start").attr("disabled", false).removeClass("ui-state-disabled");
            // enable pause button
            $('#pause').attr('disabled', false).removeClass('ui-state-disabled');
            updateDOM(zeros(pomDuration), zeros(0)); // update DOM with length of work
            fillerIncrement = 200 / (parseInt(pomDuration, 10) * 60);
            updateStatus('Back to Work!');
            clearInterval(timerIntID);
            timerRunning = false;
        }
        fillerHeight = 0;
    };

    var zeros = function(number) {
        number = parseInt(number, 10);
        if (number == 0) {
            return "00";
        }
        if (number >= 10) {
            return number.toString();
        }
        return "0" + number.toString();
    };
    var updateStatus = function(status) {
        document.querySelector(DOM.status).innerHTML = status;
    };

    // add color to pomodoro tomato
    var colorPoms = function(num, compPoms) {

        if (compPoms <= estPoms) {

            $("#image" + num + "").addClass('completed').attr('src', 'img/tomatoe.png');
        } else {
            $('#pom_icons').append("<img class='completed' id='image" + num + "'src='img/tomatoe.png'/>");
        }
    };

    var updateDOM = function(minutes, seconds) {
        document.querySelector(DOM.minutes).innerText = minutes;
        document.querySelector(DOM.seconds).innerText = seconds;
        fillerHeight = fillerHeight + fillerIncrement;
        document.querySelector(DOM.filler).style.height = fillerHeight + 'px';
    };

    return {
        init: function() {
            console.log("Application initialized!");
            setupEventListeners();

            // pomodoro duration
            pomDuration = document.querySelector(DOM.duration).value;
            updateDOM(zeros(pomDuration), "00");

            // short break
            pomSB = document.querySelector(DOM.break).value;
            document.querySelector(DOM.break).value = pomSB;

            // long break
            pomLB = document.querySelector(DOM.longBreak).value;
            document.querySelector(DOM.longBreak).value = pomLB;
        },
        startCountdown: function() {
            if (!timerRunning) {
                fillerIncrement = 200 / (parseInt(document.querySelector(DOM.duration).value, 10) * 60);
                timerIntID = setInterval(countDownTimer, 1000);
                timerRunning = true;
                work = true;
                // disable start button
                $('#start').attr('disabled', true).addClass('ui-state-disabled');
            }
        },
        pauseCountdown: function() {
            if (timerRunning) {
                clearInterval(timerIntID);
                timerRunning = false;
                work = false;
                // enable start button
                $("#start").attr("disabled", false).removeClass("ui-state-disabled");
                $("#pause").attr("disabled", false).addClass("ui-state-disabled");
            }
        },
        stopCountdown: function() {
            if (timerRunning || !timerRunning) {
                clearInterval(timerIntID);
                timerRunning = false;
                work = false;
                fillerHeight = 0;
                fillerIncrement = 0;
                updateStatus("Back to Work!");
                // enable start button
                $("#start").attr("disabled", false).removeClass("ui-state-disabled");

                // enable start button
                $("#pause").attr("disabled", false).removeClass("ui-state-disabled");

                // reset DOM values to originally selected values
                updateDOM(zeros(pomDuration), zeros(0));
            }
        },
        setDurations: function() {
            // pomodoro duration
            pomDuration = document.querySelector(DOM.duration).value;
            updateDOM(zeros(pomDuration), "00");

            // short break
            pomSB = document.querySelector(DOM.break).value;
            document.querySelector(DOM.break).value = pomSB;

            // long break
            pomLB = document.querySelector(DOM.longBreak).value;
            document.querySelector(DOM.longBreak).value = pomLB;

            // set sound and volume
            var result = AUD.setTrack();

            var res = {
                duration: pomDuration,
                shortBreak: pomSB,
                longBreak: pomLB,
                tone: result[0],
                volume: result[1]
            };

            return res;
        },
        setDefaultValues: function() {
            // pomodoro duration
            document.querySelector(DOM.duration).value = 25;
            updateDOM("25", "00");

            // short break
            document.querySelector(DOM.break).value = 5;

            // long break
            document.querySelector(DOM.longBreak).value = 15;

            // set sound and volume
            AUDCtrl.setTrack();
        }
    };
})(UIController, AUD);

$(document).ready(function() {
    pomodoro_app.init();
    AUD.init();

    $(window).resize(function() {
        fluidDialog();
    });

    // catch dialog if opened within a viewport smaller than the dialog width
    $(document).on("dialogopen", ".ui-dialog", function(event, ui) {
        fluidDialog();
    });

    function fluidDialog() {
        var $visible = $(".ui-dialog:visible");
        // each open dialog
        $visible.each(function() {
            var $this = $(this);
            var dialog = $this.find(".ui-dialog-content").data("ui-dialog");
            // if fluid option == true
            if (dialog.options.fluid) {
                var wWidth = $(window).width();
                // check window width against dialog width
                if (wWidth < (parseInt(dialog.options.maxWidth) + 50)) {
                    // keep dialog from filling entire screen
                    $this.css("max-width", "90%");
                } else {
                    // fix maxWidth bug
                    $this.css("max-width", dialog.options.maxWidth + "px");
                }
                //reposition dialog
                dialog.option("position", dialog.options.position);
            }
        });

    }

    $("#pomButton").button().click(function() {
        $('#pomoTimer-app').dialog({
            width: 'auto',
            resizable: false,
            modal: true,
            height: 'auto',
            fluid: true,
            title: "Pomo-Timer",
            buttons: {
                "Start": {
                    text: 'Start',
                    class: 'start-green',
                    id: 'start',
                    click: function() {
                        pomodoro_app.startCountdown();
                    }
                },
                "Pause": {
                    text: 'Pause',
                    class: 'pause-yellow',
                    id: 'pause',
                    click: function() {
                        pomodoro_app.pauseCountdown();
                    }
                },
                "Stop": {
                    text: 'Stop',
                    class: 'stop-red',
                    id: 'stop',
                    click: function() {
                        pomodoro_app.stopCountdown();
                    }
                }
            }
        });
    });

    // launches pomodoro settings dialogue window
    $('#pomo-settings').button().click(function() {
        $('#settings-dialog').dialog({
            width: 'auto',
            resizable: false,
            modal: true,
            fluid: true,
            buttons: [{
                    id: 'ok-settings',
                    text: 'OK',
                    click: function() {
                        var change = pomodoro_app.setDurations();
                        $(this).dialog("close");
                    }
                }, {
                    id: 'cancel-settings',
                    text: 'Cancel',
                    click: function() {
                        $(this).dialog("close");
                    }
                },
                {
                    id: 'default-settings',
                    text: 'Default',
                    click: function() {
                        pomodoro_app.setDefaultValues();
                    }
                },
                {
                    id: 'sound-settings',
                    class: 'sound_test',
                    text: 'Sound test',
                    click: function() {
                        AUD.soundTest();
                    }
                }
            ],
            open: function() {
                // if enter key is hit rather than the 'OK' button submit changes
                $('#settings-dialog').keydown(function(event) {
                    if (event.keyCode === 13 || event.which === 13) {
                        $(this).parent().find('#ok-settings').focus();
                    }
                });
                // stop the countdown on clock
                pomodoro_app.stopCountdown();
            }
        });
    });
});