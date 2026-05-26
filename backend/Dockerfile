FROM eclipse-temurin:17-jdk-jammy AS build

WORKDIR /workspace

COPY gradlew build.gradle settings.gradle ./
COPY gradle gradle
COPY src src

RUN chmod +x gradlew && \
    ./gradlew clean bootJar -x test --no-daemon && \
    jar_file="$(find build/libs -maxdepth 1 -type f -name '*.jar' ! -name '*plain*' ! -name 'original-*' | head -n 1)" && \
    cp "$jar_file" /tmp/app.jar

FROM eclipse-temurin:17-jre-jammy

WORKDIR /app

ENV PORT=8080

COPY --from=build /tmp/app.jar /app/app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]