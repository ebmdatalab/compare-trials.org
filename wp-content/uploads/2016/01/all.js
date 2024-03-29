(function ($) {
  var statistics = {
    total_trial_count: 0,
    perfect_trial_count: 0,
    total_prespec_unreported: 0,
    total_nonprespec_reported: 0,
    total_correct_outcomes: 0,
    total_all_outcomes: 0,
    letters_sent: 0,
    letters_unpublished: 0,
    letters_rejected: 0,
    letters_published: 0,
    letters_in_pipeline: 0,
  };
  not_public_str = "Not yet public";

  var assessment_tooltip =
    "We give the journal four weeks to publish the trial.";
  var prespec_tooltip =
    "Out of all the outcomes that were specified in advance, ";
  prespec_tooltip += "how many are reported in the final paper? This ";
  prespec_tooltip += "should be 100%.";
  var nonprespec_tooltip = "How many outcomes are reported that weren't ";
  nonprespec_tooltip += "specified in advance, and aren't declared as such? ";
  nonprespec_tooltip += "This should be zero.";
  var letter_tooltip = "Sometimes we judge that no letter is ";
  letter_tooltip +=
    "required, if the overall standard of outcome reporting is ";
  letter_tooltip += "sufficiently high.";

  var key = "1EgNcKJ_p4v7P0JNq5GSElKGvDX88z8QZN52n8C-yQAc";
  var columns = [
    { data: "trial", title: "Trial", width: "20%" },
    { data: "trialpublicationdate", title: "Trial published" },
    { data: "linktoassessment", title: "Our assessment", orderable: false },
    {
      data: "outcomes_str",
      title:
        'Prespecified outcomes reported<span data-toggle="tooltip" title="' +
        prespec_tooltip +
        '"> <span class="glyphicon glyphicon-question-sign" aria-hidden="true"></span></span>',
      type: "num",
      render: {
        _: "display",
        sort: "sort",
      },
    },
    {
      data: "non_prespecified_outcomes",
      title:
        'Undeclared non-prespecified outcomes reported<span data-toggle="tooltip" title="' +
        nonprespec_tooltip +
        '"> <span class="glyphicon glyphicon-question-sign" aria-hidden="true"></span></span>',
      type: "num",
      render: {
        _: "display",
        sort: "sort",
      },
    },
    {
      data: "lettersent",
      title:
        'Letter sent<span data-toggle="tooltip" title="' +
        letter_tooltip +
        '"> <span class="glyphicon glyphicon-question-sign" aria-hidden="true"></span></span>',
    },
    { data: "letterpublished", title: "Letter published?" },
  ];

  $(document).ready(function () {
    Tabletop.init({
      key: key,
      simpleSheet: true,
      parseNumbers: true,
      proxy: "/data/",
      postProcess: function (d) {
        for (var k in d) {
          if (d.hasOwnProperty(k)) {
            d[k] = typeof d[k] === "string" ? $.trim(d[k]) : d[k];
          }
        }

        // Optional switch for individual journal pages on the WordPress site.
        // We define journalName inline in journal pages.
        if (
          typeof journalName !== "undefined" &&
          d.journalname !== journalName
        ) {
          return;
        }

        statistics.total_trial_count += 1;

        // Title and publication date.
        d.trial =
          "<strong>" + d.journalname + "</strong>: <a target='_blank' href='";
        d.trial += d.linktoonlinetrialreport + "'>";
        d.trial +=
          d.trialtitle && d.trialtitle.length > 100
            ? d.trialtitle.substring(0, 100) + "..."
            : d.trialtitle;
        d.trial += "</a>";
        d.trialpublicationdate = parseDate(d.publicationdate);

        // Calculate data for outcomes columns, and add to running counts.
        // Parse numerator for prespecified outcomes column.
        var primary_correct =
            d.numberofprespecifiedprimaryoutcomescorrectlyreported,
          secondary_correct =
            d.numberofprespecifiedsecondaryoutcomescorrectlyreported,
          primary_elsewhere =
            d.numberofprespecifiedprimaryoutcomesreportedsomewhereinthepublicationotherthatmainresultstable,
          secondary_elsewhere =
            d.numberofprespecifiedsecondaryoutcomesreportedsomewhereinthepublicationotherthanmainresultstable;
        d.correct_outcomes = primary_correct ? primary_correct : 0;
        d.correct_outcomes += secondary_correct ? secondary_correct : 0;
        d.correct_outcomes += primary_elsewhere ? primary_elsewhere : 0;
        d.correct_outcomes += secondary_elsewhere ? secondary_elsewhere : 0;
        statistics.total_correct_outcomes += d.correct_outcomes;

        // Parse denominator for prespecified outcomes column.
        var total_primary = d.totalnumberofprespecifiedprimaryoutcomes,
          total_secondary = d.totalnumberofprespecifiedsecondaryoutcomes;
        d.all_outcomes = total_primary ? total_primary : 0;
        d.all_outcomes += total_secondary ? total_secondary : 0;
        statistics.total_all_outcomes += d.all_outcomes;
        statistics.total_prespec_unreported +=
          d.all_outcomes - d.correct_outcomes;

        // Parse numerator and denominator into final values for sort and display.
        d.outcomes_str = {};
        d.outcomes_str.sort =
          d.all_outcomes > 0 ? (d.correct_outcomes / d.all_outcomes) * 100 : 0;
        d.outcomes_str.display =
          d.correct_outcomes +
          "/" +
          d.all_outcomes +
          " (" +
          Math.round(d.outcomes_str.sort * 10) / 10 +
          "%)";

        // Parse non-prespecified outcomes column.
        var non_prespecified =
            d["totalnumberofnon-prespecifiedoutcomesreported"],
          non_prespecified_ok =
            d[
              "numberofnon-prespecifiedoutcomescorrectlyreportedienoveloutcomesbutdescribedassuchinthepaper"
            ];
        var val = non_prespecified ? non_prespecified : 0;
        val -= non_prespecified_ok ? non_prespecified_ok : 0;
        d.non_prespecified_outcomes = {
          sort: val,
          display: val,
        };
        statistics.total_nonprespec_reported += val;

        // Sort out dates and what to show.
        d.show = d.letterstatus !== "";
        d.lettersentdate = parseDate(d.lettersentdate);
        if (
          d.lettersentdate !== "" &&
          d.letterstatus !== "Letter not required"
        ) {
          statistics.letters_sent += 1;
        }
        d.letterpublisheddate = parseDate(d.letterpublisheddate);

        // Configure whether to show letter sent date.
        // And update statistics.
        if (d.letterstatus === "Letter not required") {
          d.lettersent = d.letterstatus;
          statistics.perfect_trial_count += 1;
        } else {
          d.lettersent = d.lettersentdate;
          if (d.show && d.linktoletter) {
            d.lettersent +=
              " <a target='_blank' href='" + d.linktoletter + "'>";
            d.lettersent += "Read online</a>";
          }
          if (d.letterstatus === "Letter rejected by editor") {
            statistics.letters_rejected += 1;
          } else if (d.letterstatus === "Letter published") {
            statistics.letters_published += 1;
          } else if (d.letterstatus === "Letter unpublished after 4 weeks") {
            statistics.letters_unpublished += 1;
          }
        }

        // Configure whether to show link to assessment, and letter
        // published date. Also configure sort strings.
        if (d.show) {
          d.linktoassessment =
            "<a href='" +
            d.linktoassessment +
            "' target='blank'>Read online</a>";
          d.letterpublished =
            d.letterstatus === "Letter published"
              ? d.letterpublisheddate
              : d.letterstatus;
        } else {
          d.linktoassessment = not_public_str;
          d.letterpublished = "Not yet published";
          d.outcomes_str = {
            sort: -1,
            display: not_public_str,
          };
          d.non_prespecified_outcomes = {
            sort: -1,
            display: not_public_str,
          };
        }
      },
      callback: function (data, tabletop) {
        statistics.letters_in_pipeline =
          statistics.letters_sent -
          statistics.letters_unpublished -
          statistics.letters_rejected -
          statistics.letters_published;
        statistics.mean_prespec_propn =
          (statistics.total_correct_outcomes / statistics.total_all_outcomes) *
          100;
        statistics.mean_nonprespec_count =
          statistics.total_nonprespec_reported / statistics.total_trial_count;
        var options = {
          useEasing: true,
          useGrouping: true,
        };
        for (var k in statistics) {
          if ($("#" + k).length) {
            var decimal_places = k.slice(0, 5) === "mean_" ? 1 : 0;
            var demo = new CountUp(
              k,
              0,
              statistics[k],
              decimal_places,
              2.5,
              options
            );
            demo.start();
          }
        }
        if (typeof journalName !== "undefined") {
          data = data.filter(function (d) {
            return d.journalname === journalName;
          });
        }
        drawTable(data);
      },
    });

    function parseDate(str) {
      // Parse dates into YYYY-MM-DD, for sorting purposes.
      var parts = str.split("/"),
        dt;
      if (parts.length > 1) {
        dt = new Date(
          parseInt(parts[2], 10),
          parseInt(parts[1], 10) - 1,
          parseInt(parts[0], 10)
        );
        str = dt.getFullYear() + "/";
        str += ("0" + (dt.getMonth() + 1)).slice(-2) + "/";
        str += ("0" + dt.getDate()).slice(-2);
      }
      return str;
    }
    function drawTable(data) {
      var html = '<table class="table table-bordered table-hover ';
      html += '" id="myTable" width="100%"></table>';
      $("#table").html(html);
      $("#myTable").DataTable({
        data: data,
        columns: columns,
        order: [[0, "asc"]],
        pageLength: 25,
        paging: true,
        pagingType: "simple",
        responsive: true,
      });
      // $('body').tooltip({
      //     selector: '[data-toggle=tooltip]',
      //     placement: 'auto top'
      // });
    }
  });
})(jQuery);
