jQuery(document).ready(function ($) {
  var e = "img." != cssTarget ? cssTarget : "img.style-svg";
  jQuery(e).each(function (e) {
    var t = jQuery(this),
      r = t.attr("id"),
      a = t.attr("class"),
      d = t.attr("src");
    jQuery.get(
      d,
      function (d) {
        var s = jQuery(d).find("svg"),
          i = s.attr("id");
        "undefined" == typeof r
          ? "undefined" == typeof i
            ? ((r = "svg-replaced-" + e), (s = s.attr("id", r)))
            : (r = i)
          : (s = s.attr("id", r)),
          "undefined" != typeof a && (s = s.attr("class", a + " replaced-svg")),
          (s = s.removeAttr("xmlns:a")),
          t.replaceWith(s),
          jQuery(document).trigger("svg.loaded", [r]);
      },
      "xml"
    );
  });
});
