"use strict";
/* global d3 */

function compareCities(data) {
  var nestedData = d3.nest()
    .key((d) => d.departamento)
    .rollup((leaves) => {
      return {
        "length": leaves.length,
        "votantes": d3.sum(leaves, (d)  => d.votantes ),
        "values": leaves
      };
    })
    .sortValues((a,b) =>
      d3.descending(a["iván duque result"], b["iván duque result"]) || d3.descending(a.votantes, b.votantes)
    )
    .entries(data)
    .sort((a,b) => d3.descending(a.value.votantes, b.value.votantes));

  var stateChart = pilledStackedChart();

  d3.select("#barCharts")
    .data([nestedData])
    .call(stateChart);

}


function pilledStackedChart() {
  var keys = ["iván duque result", "votos_en_blanco result","nulos_no_marcados", "gustavo petro result", ];
  var cScale = d3.scaleOrdinal()
      .domain(keys)
      .range([d3.schemeBlues[9][4], d3.schemeGreys[9][4], d3.schemeReds[9][4], d3.schemeOranges[9][4] ]),
    x = d3.scaleLinear()
      .domain([0, 1])
      .rangeRound([0, 100]),
    h = d3.scaleLinear()
      .rangeRound([1, 400]),
    fmtPct = d3.format(".2%"),
    fmtM = d3.format(".2s");


  function doCity(selection) {
    selection
      .selectAll(".cityCandidate")
      .data(d =>
        d3.stack().keys(keys)([d])
      )
      .enter()
      .append("div")
      .attr("class", "cityCandidate")
      .style("background", function(d) {
        return cScale(d.key);
      })
      // .selectAll(".cityCandidate")
      // .data(function(d) { return d; })
      // .enter()
      // .append("div")
      // .attr("class", "cityCandidate")
      .style("position", "absolute")
      .style("top", 0)
      .style("left", (d) =>
        x(d[0][0]) + "%"
      )
      .style("width", function(d) {
        return (x(d[0][1]) - x(d[0][0]))  + "%";
      });
  }



  function chart(selection) {
    selection.each(function(data) {

      data.forEach((state) => {
        state.maxVotantes = d3.max(state.value.values, d=> d.votantes);
        state.minVotantes = d3.min(state.value.values, d=> d.votantes);
        state.value.values.forEach(city => city.capital = (state.maxVotantes === city.votantes));
      });
      h.domain([
        d3.min(data, state => state.minVotantes),
        d3.max(data, state => state.maxVotantes)
      ]);

      var states = d3.select(this).selectAll(".state").data(data, d => d.key);

      // Otherwise, create the skeletal chart.
      var statesEnter = states.enter().append("div")
        .attr("class", "state col-md-2 col-s-4 col-xs-6");

      statesEnter.append("h3")
        .text(d=> d.key);

      var cities = statesEnter.merge(states)
        .attr("id", (d) => d.key)
        .selectAll(".city")
        .data(d =>
          d.value.values
        );

      var citiesEnter = cities
        .enter()
        .append("div")
        .attr("class", "city");

      citiesEnter.merge(cities)
        .attr("title", d => {
          return d.departamento + " " + d.municipio +
            "\n" +
            "Duque=" + fmtPct(d["iván duque result"]) + "\n" +
            "Petro=" + fmtPct(d["gustavo petro result"]) + "\n" +
            "Blancos=" + fmtPct(d["votos_en_blanco result"]) + "\n" +
            "Nulos y No marcados=" + fmtPct(d["nulos_no_marcados"]) + "\n" +
            "Total Votantes=" + fmtM(d.votantes);
        })
        .classed("capital", d => d.capital);

      citiesEnter.append("p")
        .attr("class", "cityLabel")
        .text((d) => d.municipio);

      citiesEnter.append("div")
        .attr("class", "fifty")
        .merge(cities.select(".fifty"));


      citiesEnter.merge(cities)
        .style("position", "relative")
        .style("height", d => {
          return h(d.total_votantes) + "px";
        })
        .attr("id", (d) => d.departamento + d.municipio)
        .call(doCity);

    });
  }

  return chart;
}

