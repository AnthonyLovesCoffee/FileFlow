FROM maven:3.9.8-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src/ src/

RUN mvn clean package -DskipTests

FROM openjdk:21-jdk-slim
WORKDIR /app
ENV JAVA_OPTS=""
COPY --from=build /app/target/*.jar app.jar
RUN apt-get update && apt-get install -y curl

EXPOSE 8081

HEALTHCHECK --interval=10s --timeout=3s --start-period=30s \
  CMD curl -f http://minio:9000/minio/health/live || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
