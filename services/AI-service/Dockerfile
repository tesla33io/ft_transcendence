FROM maven:sapmachine as jarBuilder

WORKDIR /app

COPY /aibot/pom.xml .

RUN mvn dependency:go-offline

COPY . .

WORKDIR /app/aibot

RUN mvn clean package



FROM openjdk:26-jdk-bookworm

WORKDIR /app

COPY --from=jarBuilder /app/aibot/target/aibot-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 5100

ENTRYPOINT [ "java", "-jar", "app.jar" ]
