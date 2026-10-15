import * as Effect from "effect/Effect"
import { pipe } from "effect/Function"
import type * as HttpClient from "effect/http/HttpClient"
import * as HttpClientRequest from "effect/http/HttpClientRequest"
import * as HttpClientResponse from "effect/http/HttpClientResponse"
import * as UrlParams from "effect/http/UrlParams"
import type * as WorkOSError from "../../domain/Errors.ts"
import * as HttpResponseExtensions from "../http/HttpResponseExtensions.ts"
import * as SchemaExtensions from "../schema/SchemaExtensions.ts"
import { ListEventsParameters, ListEventsResponse } from "./EventsApiClientDefinitionSchemas.ts"

export interface Client {
  readonly listEvents: (
    parameters: typeof ListEventsParameters.Type
  ) => Effect.Effect<ListEventsResponse, WorkOSError.WorkOSCommonError>
}

export const make = (httpClient: HttpClient.HttpClient): Client => ({
  listEvents: (parameters) =>
    pipe(
      parameters,
      SchemaExtensions.encodeCatching(ListEventsParameters),
      Effect.map((_) =>
        pipe(
          HttpClientRequest.get(""),
          HttpClientRequest.setUrlParams(UrlParams.fromInput(_))
        )
      ),
      Effect.andThen(httpClient.execute),
      HttpResponseExtensions.catchNetworkErrors,
      Effect.flatMap(
        HttpClientResponse.matchStatus({
          "2xx": HttpResponseExtensions.decodeExpected(ListEventsResponse),
          orElse: HttpResponseExtensions.unexpectedStatus
        })
      )
    )
})
