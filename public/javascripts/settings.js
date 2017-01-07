$(document).ready(function() {
  $('input, select').change(function(e) {
    var checkedExercises = [];

    $('.exercise').each(function(i) {
      if ($(this).is(':checked')){
        checkedExercises.push($(this).prop('id'));
      }
    });

    console.log(checkedExercises);

    let newSettings = {
      bpm: $('#bpm').val(),
      notesPerBeat: $('#notesPerBeat').val(),
      octaves: $('#octaves').val(),
      scaleSettings: {
        'includeModes': $('#scaleIncludeModes').prop('checked'),
        'useRandomMode': $('#scaleUseRandomMode').prop('checked'),
      },
      arpeggioSettings: {
        'includeModes': $('#arpeggioIncludeModes').prop('checked'),
        'useRandomMode': $('#arpeggioUseRandomMode').prop('checked'),
      },
      exercises: checkedExercises,
    };

    $.post('/settings', {settings: newSettings}, function(data) {
      console.log('settings saved');
      console.log(data);
    });
  });
});
