FROM maven:sapmachine AS jar_builder

WORKDIR /app

COPY /aibot/pom.xml .

RUN mvn dependency:go-offline

COPY . .

WORKDIR /app/aibot

RUN mvn clean package



FROM eclipse-temurin:21-jdk

WORKDIR /app

COPY --from=jar_builder /app/aibot/target/aibot-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 5100

ENTRYPOINT [ "java", "-jar", "app.jar" ]
