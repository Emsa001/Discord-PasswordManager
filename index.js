const {
  Client,
  Intents,
  MessageEmbed,
  CommandInteractionOptionResolver,
} = require("discord.js");
const { Sequelize, Model, DataTypes } = require("sequelize");
const sequelize = require("sequelize");
const db = require("./database/db");
const pswdb = require("./database/pass");
const categories = require("./database/categories");
const generator = require("generate-password");

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});
const { prefix, pin, token } = require("./config.json");
const { beforeValidate } = require("./database/db");

var passadd,
  checkpinuser,
  allowpass = false;

var pcategory, puser, ppass, psite;
var pstatus = 0;

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
  db.authenticate()
    .then(() => {
      console.log("Logged in to DB!");

      pswdb.init(db);
      pswdb.sync();
      categories.init(db);
      categories.sync();
    })
    .catch((err) => console.log(err));
});

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

client.on("messageCreate", async (message) => {
  if (message.author.bot) return 0;

  if (checkpinuser) {
    message.delete();
    if (message.content === pin) {
      allowpass = true;
      checkpinuser = false;
      return message.channel
        .send({
          embeds: [
            new MessageEmbed().setColor("GREEN").setTitle(`✅ Correct!`),
          ],
        })
        .then((message) => {
          setTimeout(() => {
            allowpass = false;
          }, 60000),
            setTimeout(() => message.delete(), 10000).catch((error) => {
              console.log(`Error while deleting a message: ${error}`);
            });
        })
        .catch((error) => {
          console.log(`Error while sending an embed: ${error}`);
        });
    } else {
      return message.channel
        .send({
          embeds: [
            new MessageEmbed().setColor("RED").setTitle(`❌ Wrong PIN!`),
          ],
        })
        .then((message) => {
          setTimeout(() => message.delete(), 10000).catch((error) => {
            console.log(`Error while deleting a message ${error}`);
          });
        })
        .catch((error) => {
          console.log(`Error while sending an embed: ${error}`);
        });
    }
  }
  if (passadd) {
    message.delete();
    switch (pstatus) {
      case 0:
        puser = message.content;
        pstatus++;
        var embed = new MessageEmbed()
          .setColor("GREEN")
          .setTitle(`✅ Enter the password: `);

        return message.channel
          .send({ embeds: [embed] })
          .then((message) => {
            setTimeout(() => message.delete(), 10000).catch((error) =>
              console.log(`Error while deleting a message ${error}`)
            );
          })
          .catch((error) => {
            console.log(`Error while sending an embed: ${error}`);
          });

        break;
      case 1:
        ppass = message.content;
        pstatus++;
        var embed = new MessageEmbed()
          .setColor("GREEN")
          .setTitle(`✅ Enter the category: `);

        return message.channel
          .send({ embeds: [embed] })
          .then((message) => {
            setTimeout(() => message.delete(), 10000).catch((error) =>
              console.log(`Error while deleting a message ${error}`)
            );
          })
          .catch((error) => {
            console.log(`Error while sending an embed: ${error}`);
          });

        break;
      case 2:
        var checkCategory = await categories.findOne({
          where: {
            name: message.content.toLowerCase(),
          },
        });
        if (!checkCategory) {
          var embed2 = new MessageEmbed()
            .setColor("RED")
            .setTitle(`There is no such a category!`);
          return message.channel
            .send({ embeds: [embed2] })
            .then((message) => {
              setTimeout(() => message.delete(), 10000).catch((error) =>
                console.log(`Error while deleting a message ${error}`)
              );
            })
            .catch((error) => {
              console.log(`Error while sending an embed: ${error}`);
            });
        } else {
          pcategory = message.content;
          pstatus++;
          var embed3 = new MessageEmbed()
            .setColor("GREEN")
            .setTitle(`✅ Enter the website: `);

          return message.channel
            .send({ embeds: [embed3] })
            .then((message) => {
              setTimeout(() => message.delete(), 10000).catch((error) =>
                console.log(`Error while deleting a message ${error}`)
              );
            })
            .catch((error) => {
              console.log(`Error while sending an embed: ${error}`);
            });
        }
        break;
      case 3:
        psite = message.content;

        const createPass = await pswdb.create({
          category: pcategory,
          username: puser,
          password: ppass,
          site: psite,
          owner: message.author.tag,
        });

        pstatus = 0;
        passadd = false;
        message.channel.send({ embeds: [embed] }).catch((error) => {
          console.log(`Error while sending an embed: ${error}`);
        });

        var embed2 = new MessageEmbed()
          .setColor("GREEN")
          .setTitle(`✅ Succesfully saved the password`);

        return message.channel
          .send({ embeds: [embed2] })
          .then((message) => {
            setTimeout(() => message.delete(), 10000).catch((error) =>
              console.log(`Error while deleting a message ${error}`)
            );
          })
          .catch((error) => {
            console.log(`Error while sending an embed: ${error}`);
          });

        break;
    }
  }

  if (!message.content.startsWith(prefix)) return 0;

  const commandBody = message.content.slice(prefix.length).trim();
  const args = commandBody.split(/ +/);
  const commandName = args.shift().toLowerCase();

  message.delete();

  switch (commandName) {
    case "category":
      switch (args[0]) {
        case "list":
          const lastid = await categories.findOne({
            order: [["configId", "DESC"]],
            limit: 1,
          });
          const list = await categories.count();
          var a = "";

          for (var i = 1; i <= lastid?.configId || 0; i++) {
            var listCategory = await categories.findOne({
              where: {
                configId: i,
              },
            });
            if (listCategory) {
              if (!a.includes(listCategory.name)) {
                a += `**►** ${capitalizeFirstLetter(
                  listCategory.name
                )} (${await pswdb
                  .count({
                    where: {
                      category: listCategory.name,
                    },
                  })
                  .catch((error) =>
                    console.log(
                      `Error while checking list of categories: ${error}`
                    )
                  )})\n`;
              }
            }
          }
          const categorylistE = new MessageEmbed()
            .setColor("#0099ff")
            .setTitle(`Your Categories (${list})`)
            .setDescription(a);

          try {
            message.channel
              .send({ embeds: [categorylistE] })
              .then((message) => {
                setTimeout(() => message.delete(), 10000).catch((error) =>
                  console.log(`Error while deleting a message ${error}`)
                );
              })
              .catch((error) => {
                console.log(`Error while sending an embed: ${error}`);
              });
          } catch (error) {
            console.log(`Error while sending an embed: ${error}`);
          }

          break;
        case "add":
          if (!args[1]) {
            const ErrorArgumentC = new MessageEmbed()
              .setColor("RED")
              .setTitle(`You're missing an argument`);
            return message.channel
              .send({ embeds: [ErrorArgumentC] })
              .then((message) => {
                setTimeout(() => message.delete(), 10000).catch((error) =>
                  console.log(`Error while deleting a message ${error}`)
                );
              })
              .catch((error) => {
                console.log(`Error while sending an embed: ${error}`);
              });
          }

          const listCategoryC = await categories.findOne({
            where: {
              name: args[1].toLowerCase(),
            },
          });

          if (listCategoryC) {
            const CreateCategoryENDE = new MessageEmbed()
              .setColor("RED")
              .setTitle(`❌ This category already exists`);

            return message.channel
              .send({ embeds: [CreateCategoryENDE] })
              .catch((error) => {
                console.log(`Error while sending an embed: ${error}`);
              });
          }

          const createCategory = await categories
            .create({
              name: args[1].toLowerCase(),
              owner: message.author.tag,
            })
            .then(() => {
              const CreateCategoryEE = new MessageEmbed()
                .setColor("GREEN")
                .setTitle(`✅ Good job!`)
                .setDescription("Your category has been succesfully added");

              return message.channel
                .send({ embeds: [CreateCategoryEE] })
                .then((message) => {
                  setTimeout(() => message.delete(), 10000).catch((error) =>
                    console.log(`Error while deleting a message ${error}`)
                  );
                })
                .catch((error) => {
                  console.log(`Error while sending an embed: ${error}`);
                });
            })
            .catch((error) =>
              console.log(`Error while creating a new category: ${error}`)
            );
          break;

        case "remove":
          if (!args[1]) {
            const ErrorArgumentC = new MessageEmbed()
              .setColor("RED")
              .setTitle(`You're missing an argument`);
            return message.channel
              .send({ embeds: [ErrorArgumentC] })
              .then((message) => {
                setTimeout(() => message.delete(), 10000).catch((error) =>
                  console.log(`Error while deleting a message ${error}`)
                );
              })
              .catch((error) => {
                console.log(`Error while sending an embed: ${error}`);
              });
          }

          const listCategoryR = await categories.findOne({
            where: {
              name: args[1].toLowerCase(),
            },
          });

          if (!listCategoryR) {
            const CreateCategoryRE = new MessageEmbed()
              .setColor("RED")
              .setTitle(`❌ This category does not exist`);

            return message.channel
              .send({ embeds: [CreateCategoryRE] })
              .then((message) => {
                setTimeout(() => message.delete(), 10000).catch((error) =>
                  console.log(`Error while deleting a message ${error}`)
                );
              })
              .catch((error) => {
                console.log(`Error while sending an embed: ${error}`);
              });
          }

          await listCategoryR
            .destroy()
            .then(() => {
              const CreateCategoryE = new MessageEmbed()
                .setColor("GREEN")
                .setTitle(`✅ Good job!`)
                .setDescription("Your category has been removed succesfully");

              return message.channel
                .send({ embeds: [CreateCategoryE] })
                .then((message) => {
                  setTimeout(() => message.delete(), 10000).catch((error) =>
                    console.log(`Error while deleting a message ${error}`)
                  );
                })
                .catch((error) => {
                  console.log(`Error while sending an embed: ${error}`);
                });
            })
            .catch((error) =>
              console.log(`Error while creating a new category: ${error}`)
            );

          break;
        default:
          var helpEmbed = new MessageEmbed()
            .setColor("#0099ff")
            .setTitle("PasswordManager - help")
            .setURL("https://github.com/Emsa001/Discord-PasswordManager")
            .setAuthor(
              "Emsa001",
              "https://avatars.githubusercontent.com/u/59392453?v=4",
              "https://github.com/Emsa001"
            )
            .setDescription("Password Manager - Discord bot created by Emsa001")
            .addFields(
              {
                name: `◾️ ${prefix}pass gen <length (16)>`,
                value: "▸ Password generator",
                inline: false,
              },
              {
                name: `◾️ ${prefix}pass list <category>`,
                value: "▸ Check your passwords",
                inline: false,
              },
              {
                name: `◾️ ${prefix}pass add / remove`,
                value: "▸ Add or remove a password",
                inline: false,
              },
              {
                name: `◾️ ${prefix}category list`,
                value: "▸ List of all categories",
                inline: true,
              },
              {
                name: `◾️ ${prefix}category add / remove`,
                value: "▸ Add or remove a category",
                inline: true,
              }
            )
            .setTimestamp()
            .setFooter("Version: 1.01");
          return message.channel.send({ embeds: [helpEmbed] });
          break;
      }
      break;
    case "pass":
      if (allowpass == false && args[0] != "gen") {
        checkpinuser = true;
        return message.channel
          .send({
            embeds: [
              new MessageEmbed()
                .setColor("ORANGE")
                .setTitle(`✅ Enter the PIN:`),
            ],
          })
          .then((message) => {
            setTimeout(() => message.delete(), 10000).catch((error) => {
              console.log(`Error while deleting a message ${error}`);
            });
          })
          .catch((error) => {
            console.log(`Error while sending an embed: ${error}`);
          });
      }
      switch (args[0]) {
        case "add":
          passadd = true;
          var embed = new MessageEmbed()
            .setColor("GREEN")
            .setTitle(`✅ Enter the username:`);

          return message.channel
            .send({ embeds: [embed] })
            .then((message) => {
              setTimeout(() => message.delete(), 10000).catch((error) => {
                console.log(`Error while deleting a message ${error}`);
              });
            })
            .catch((error) => {
              console.log(`Error while sending an embed: ${error}`);
            });

          break;
        case "remove":
          var embed = new MessageEmbed().setTitle(
            `Usage: ${prefix}pass remove <password> <category>`
          );

          if (!args[2])
            return message.channel.send({ embeds: [embed] }).catch((error) => {
              console.log(`Error while sending an embed: ${error}`);
            });
          var findPassword = await pswdb.findOne({
            where: {
              password: args[1],
              category: args[2],
              owner: message.author.tag,
            },
          });

          if (!findPassword)
            return message.channel
              .send({
                embeds: [
                  new MessageEmbed()
                    .setColor("RED")
                    .setTitle(`Error`)
                    .setDescription(
                      `There is no such a password in **${args[2]}** category`
                    ),
                ],
              })
              .then((message) => {
                setTimeout(() => message.delete(), 10000).catch((error) => {
                  console.log(`Error while deleting a message ${error}`);
                });
              })
              .catch((error) => {
                console.log(`Error while sending an embed: ${error}`);
              });

          await findPassword
            .destroy()
            .then(() => {
              return message.channel
                .send({
                  embeds: [
                    new MessageEmbed()
                      .setColor("GREEN")
                      .setTitle(`✅ Good job!`)
                      .setDescription(
                        "Your password has been removed succesfully"
                      ),
                  ],
                })
                .then((message) => {
                  setTimeout(() => message.delete(), 10000).catch((error) => {
                    console.log(`Error while deleting a message ${error}`);
                  });
                })
                .catch((error) => {
                  console.log(`Error while sending an embed: ${error}`);
                });
            })
            .catch((error) => {
              console.log(`Error while creating a new category: ${error}`);
            });
          break;
        case "list":
          if (args[1]) {
            var findPassword = await pswdb.findAll({
              where: {
                category: args[1],
                owner: message.author.tag,
              },
            });
          } else {
            var findPassword = await pswdb.findAll({
              where: {
                owner: message.author.tag,
              },
            });
          }
          var pswds = "";
          for (var i = 0; i < findPassword.length; i++) {
            pswds += `**Username:** ${findPassword[i].username}\n**Password:** ${findPassword[i].password}\n**Website:** ${findPassword[i].site}\n\n`;
          }
          return message.channel
            .send({
              embeds: [
                new MessageEmbed()
                  .setColor("GREEN")
                  .setTitle(
                    `✅ Your passwords in ${(
                      args[1] || "every"
                    ).toUpperCase()} category`
                  )
                  .setDescription(`${pswds}`),
              ],
            })
            .then((message) => {
              setTimeout(() => message.delete(), 10000).catch((error) => {
                console.log(`Error while deleting a message ${error}`);
              });
            })
            .catch((error) => {
              console.log(`Error while sending an embed: ${error}`);
            });
          break;
        case "gen":
          var password = generator.generate({
            length: parseInt(args[1]) || 16,
            numbers: true,
            symbols: true,
            strict: true,
          });

          return message.channel
            .send({
              embeds: [
                new MessageEmbed()
                  .setColor("GREY")
                  .setTitle(`✅ Your generated password:`)
                  .setDescription(
                    `${password}\n\n**Characters:** ${
                      parseInt(args[1]) || "16"
                    }`
                  ),
              ],
            })
            .then((message) => {
              setTimeout(() => message.delete(), 30000).catch((error) => {
                console.log(`Error while deleting a message ${error}`);
              });
            })
            .catch((error) => {
              console.log(`Error while sending an embed: ${error}`);
            });

          break;
        default:
          var helpEmbed = new MessageEmbed()
            .setColor("#0099ff")
            .setTitle("PasswordManager - help")
            .setURL("https://github.com/Emsa001/Discord-PasswordManager")
            .setAuthor(
              "Emsa001",
              "https://avatars.githubusercontent.com/u/59392453?v=4",
              "https://github.com/Emsa001"
            )
            .setDescription("Password Manager - Discord bot created by Emsa001")
            .addFields(
              {
                name: `◾️ ${prefix}pass gen <length (16)>`,
                value: "▸ Password generator",
                inline: false,
              },
              {
                name: `◾️ ${prefix}pass list <category>`,
                value: "▸ Check your passwords",
                inline: false,
              },
              {
                name: `◾️ ${prefix}pass add / remove`,
                value: "▸ Add or remove a password",
                inline: false,
              },
              {
                name: `◾️ ${prefix}category list`,
                value: "▸ List of all categories",
                inline: true,
              },
              {
                name: `◾️ ${prefix}category add / remove`,
                value: "▸ Add or remove a category",
                inline: true,
              }
            )
            .setTimestamp()
            .setFooter("Version: 1.01");
          return message.channel.send({ embeds: [helpEmbed] });
          break;
      }
      break;
    case "help":
      var helpEmbed = new MessageEmbed()
        .setColor("#0099ff")
        .setTitle("PasswordManager - help")
        .setURL("https://github.com/Emsa001/Discord-PasswordManager")
        .setAuthor(
          "Emsa001",
          "https://avatars.githubusercontent.com/u/59392453?v=4",
          "https://github.com/Emsa001"
        )
        .setDescription("Password Manager - Discord bot created by Emsa001")
        .addFields(
          {
            name: `◾️ ${prefix}pass gen <length (16)>`,
            value: "▸ Password generator",
            inline: false,
          },
          {
            name: `◾️ ${prefix}pass list <category>`,
            value: "▸ Check your passwords",
            inline: false,
          },
          {
            name: `◾️ ${prefix}pass add / remove`,
            value: "▸ Add or remove a password",
            inline: false,
          },
          {
            name: `◾️ ${prefix}category list`,
            value: "▸ List of all categories",
            inline: true,
          },
          {
            name: `◾️ ${prefix}category add / remove`,
            value: "▸ Add or remove a category",
            inline: true,
          }
        )
        .setTimestamp()
        .setFooter("Version: 1.01");
      return message.channel.send({ embeds: [helpEmbed] });
      break;
  }
});

client.login(token);
