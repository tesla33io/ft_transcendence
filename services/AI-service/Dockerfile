FROM openjdk:26-jdk-bookworm

WORKDIR /app

COPY aibot/target/aibot-0.0.1-SNAPSHOT.jar.original app.jar

EXPOSE 5100

ENTRYPOINT [ "java", "-jar", "app.jar" ]
