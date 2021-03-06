const Discord = require("discord.js");
const mongo = require("../../mongo");
const Event = require("../../models/event.model");

const convertTZ = (date, tzString) => {
  return new Date(
    (typeof date === "string" ? new Date(date) : date).toLocaleString("en-US", {
      timeZone: tzString,
    })
  );
};

const getDateAndTime = (dateObj) => {
  dateObj = convertTZ(dateObj, "Asia/Kolkata");
  dateObj = dateObj.toString();

  const pos = dateObj.indexOf(":") - 2;
  return [
    dateObj.substring(4, pos),
    dateObj.substring(pos, pos + 5) + " (IST)",
  ];
};

const formatDate = (date) => {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0"); //January is 0!
  const yyyy = date.getFullYear();

  const resDate = yyyy + "/" + mm + "/" + dd;
  return resDate;
};

const compute = (eventObjects) => {
  const events = [];
  for (let index in eventObjects) {
    const elem = eventObjects[index];

    index = String(parseInt(index) + 1);
    const dateAndTime = getDateAndTime(elem.date);

    events.push({
      name: `${index}. ${elem.title}`,
      value: `**Date:** ${dateAndTime[0]}
             **Time:** ${dateAndTime[1]}  
             **Venue:** ${elem.venue}`,
      inline: false,
    });
  }

  return events;
};

module.exports = {
  name: "!showevents",
  description: "Show all events",
  usage: " ```!showevents\n\nType the command to view all the events.```",
  execute: async (message, args) => {
    await mongo().then(async (mongoose) => {
      await Event.find()
        .sort("date")
        .then(async (response) => {
          var today = new Date();
          for (let index in response) {
            if (formatDate(response[index].date) >= formatDate(today)) {
              continue;
            }
            const id = response[index]._id;
            await Event.findByIdAndRemove(id);
          }
        });
      try {
        await Event.find()
          .sort("date")
          .then((response) => {
            const events = compute(response);

            if (events.length > 0) {
              const eventsEmbedded = new Discord.MessageEmbed()
                .setTitle("All Events")
                .addFields(events);

              message.channel.send(eventsEmbedded);
            } else message.channel.send("No events to display. 😅");
          });
      } finally {
        mongoose.connection.close();
      }
    });
  },
};
