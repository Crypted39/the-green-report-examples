ThisBuild / version := "0.1.0-SNAPSHOT"

ThisBuild / scalaVersion := "3.3.1"

libraryDependencies += "org.scalatest" %% "scalatest" % "3.2.15" % "test"
libraryDependencies += "org.scalatestplus" %% "scalacheck-1-15" % "3.2.11.0" % "test"
libraryDependencies += "org.scalacheck" %% "scalacheck" % "1.17.0" % "test"

lazy val root = (project in file("."))
  .settings(
    name := "Property-Based Testing"
  )
