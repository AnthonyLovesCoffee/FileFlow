package com.anthonydaniel.fileflow.metadata;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.graphql.execution.RuntimeWiringConfigurer;

@Configuration
public class GraphQLConfig {
    @Bean
    public RuntimeWiringConfigurer runtimeWiringConfigurer() {
        return wiringBuilder -> wiringBuilder
                .scalar(graphql.Scalars.GraphQLID)
                .scalar(graphql.Scalars.GraphQLString)
                .scalar(graphql.Scalars.GraphQLInt);
    }
}