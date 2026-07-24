export class WeatherConfigError extends Error {
	constructor(message: string) {
		super(message)
		this.name = "WeatherConfigError"
	}
}

export class OpenWeatherRateLimitError extends Error {
	readonly status: number

	constructor(status: number, message: string) {
		super(message)
		this.name = "OpenWeatherRateLimitError"
		this.status = status
	}
}
