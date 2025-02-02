const Sequelize = require("sequelize");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { STRING } = Sequelize;
const config = {
  logging: false,
};

if (process.env.LOGGING) {
  delete config.logging;
}
const conn = new Sequelize(
  process.env.DATABASE_URL || "postgres://localhost/acme_db",
  config
);

const User = conn.define("user", {
  username: STRING,
  password: STRING,
});

User.byToken = async (token) => {
  const decodedId = jwt.verify(token, "Margarita", function (err, decoded) {
    return decoded.userId;
  });
  try {
    const user = await User.findByPk(decodedId);
    if (user) {
      return user;
    }
    const error = Error("bad credentials");
    error.status = 401;
    throw error;
  } catch (ex) {
    const error = Error("bad credentials");
    error.status = 401;
    throw error;
  }
};

User.authenticate = async ({ username, password }) => {
  // console.log("HASH AUTH",hash)
  const user = await User.findOne({
    where: {
      username,
    },
  });
  const compare = bcrypt.compareSync(password, user.password);
  const token = jwt.sign({ userId: user.id }, "Margarita");
  if (compare) {
    return token;
  }
  const error = Error("bad credentials");
  error.status = 401;
  throw error;
};

const syncAndSeed = async () => {
  await conn.sync({ force: true });
  
  const credentials = [
    { username: "lucy", password: "lucy_pw" },
    { username: "moe", password: "moe_pw" },
    { username: "larry", password: "larry_pw" },
  ];
 
    
    const [lucy, moe, larry] = await Promise.all(
      credentials.map(async (credential) => { 
          const hash = await bcrypt.hash(credential.password, 10);
          credential.password = hash;
          User.create(credential)
          // console.log("CREDENTIALS---", credential)
          return credential
        }
      )
    )
        return {
          users: {
            lucy,
            moe,
            larry,
          },
        }
      };

module.exports = {
  syncAndSeed,
  models: {
    User,
  },
};
